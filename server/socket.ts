import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import GameSession from './models/GameSession.js';
import Quiz from './models/Quiz.js';

// Socket properties are augmented in types/socket.d.ts

// ── Server-authoritative quiz state ──
// Keyed by gameCode. Survives socket reconnects within the same server process.
interface QuizState {
    quizId: string;
    currentQuestionIndex: number;
    questionData: any | null;
    startedAt: Date | null;
}
const quizStateMap = new Map<string, QuizState>();

export const setupSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // Middleware to verify JWT token
    io.use((socket: Socket, next: (err?: Error) => void) => {
        const token = socket.handshake.auth.token;
        if (!token) return next();
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            socket.user = { _id: decoded.id, role: decoded.role };
            next();
        } catch {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: Socket) => {
        // Generic room join (for teachers/hosts)
        socket.on('join_room', ({ gameCode }: { gameCode: string }) => {
            socket.join(gameCode);
            socket.gameCode = gameCode;
        });

        // ── Join a game room (students) ──
        socket.on('join_game', async ({ gameCode, name, userId, participantId }: {
            gameCode: string; name: string; userId?: string; participantId?: string;
        }) => {
            try {
                const session = await GameSession.findOne({ gameCode })
                    .select('_id quizId quizTitle teacherId status currentQuestionIndex questionStartedAt participants gameCode');
                if (!session || session.status === 'ended') {
                    socket.emit('error', { message: 'Session not found or already ended' });
                    return;
                }

                const quiz = await Quiz.findById(session.quizId).select('questions title subject');
                const questions = quiz ? quiz.questions : [];

                socket.join(gameCode);
                socket.gameCode = gameCode;
                socket.participantId = (participantId as string) || '';

                io.to(gameCode).emit('player_joined', { name, userId, socketId: socket.id, participantId });
                socket.emit('session_state', { session, questions });

                // ── Immediately sync student to current question if game is live ──
                const state = quizStateMap.get(gameCode);
                if (state && (session.status === 'question' || session.status === 'playing')) {
                    socket.emit('current_state', {
                        currentQuestionIndex: state.currentQuestionIndex,
                        questionData: state.questionData,
                        startedAt: state.startedAt,
                    });
                }
            } catch (error) {
                console.error('[join_game]', error);
                socket.emit('error', { message: 'Internal server error' });
            }
        });

        // ── Student requests current state (for reconnects / polling) ──
        socket.on('get_current_state', ({ gameCode }: { gameCode: string }) => {
            const state = quizStateMap.get(gameCode);
            if (state) {
                socket.emit('current_state', {
                    currentQuestionIndex: state.currentQuestionIndex,
                    questionData: state.questionData,
                    startedAt: state.startedAt,
                });
            }
        });

        // ── Teacher starts the game ──
        socket.on('start_game', async ({ gameCode }: { gameCode: string }) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') {
                    return socket.emit('error', { message: 'Only teachers can start the game' });
                }
                const session = await GameSession.findOne({ gameCode })
                    .select('_id quizId teacherId status currentQuestionIndex questionStartedAt participants');
                if (!session || String(session.teacherId) !== String(socket.user._id)) {
                    return socket.emit('error', { message: 'Unauthorized to start this session' });
                }

                session.status = 'question';
                session.currentQuestionIndex = 0;
                session.questionStartedAt = new Date();
                await session.save();

                const quiz = await Quiz.findById(session.quizId).select('questions title subject');
                const questionData = quiz ? quiz.questions[0] : null;

                // Update server-side quiz state
                quizStateMap.set(gameCode, {
                    quizId: String(session.quizId),
                    currentQuestionIndex: 0,
                    questionData,
                    startedAt: session.questionStartedAt,
                });

                io.to(gameCode).emit('game_started', session);
                // Send authoritative state so all students immediately get question 0
                io.to(gameCode).emit('current_state', {
                    currentQuestionIndex: 0,
                    questionData,
                    startedAt: session.questionStartedAt,
                });
            } catch (error) {
                console.error('[start_game]', error);
            }
        });

        // ── Teacher moves to next question ──
        socket.on('next_question', async ({ gameCode, nextIndex }: { gameCode: string; nextIndex: number }) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') return;
                await advanceGame(gameCode, nextIndex, socket);
            } catch (error) {
                console.error('[next_question]', error);
            }
        });

        // Helper to advance game (shared by manual and auto-progression)
        const advanceGame = async (gameCode: string, nextIndex: number, teacherSocket?: Socket) => {
            const session = await GameSession.findOne({ gameCode })
                .select('_id quizId teacherId participants status currentQuestionIndex questionStartedAt currentQuestionAnswers');
            if (!session) return;

            const quiz = await Quiz.findById(session.quizId).select('questions title subject');
            if (!quiz) return;

            if (nextIndex >= quiz.questions.length) {
                // End game logic
                await handleEndGame(gameCode);
            } else {
                session.status = 'question';
                session.currentQuestionIndex = nextIndex;
                session.questionStartedAt = new Date();
                session.currentQuestionAnswers = [];

                if (session.participants) {
                    session.participants.forEach((p: any) => { p.hasAnsweredCurrentQuestion = false; });
                }
                session.markModified('participants');
                await session.save();

                const question = quiz.questions[nextIndex];

                quizStateMap.set(gameCode, {
                    quizId: String(session.quizId),
                    currentQuestionIndex: nextIndex,
                    questionData: question,
                    startedAt: session.questionStartedAt,
                });

                if (teacherSocket) teacherSocket.emit('ack_next_question', { nextIndex });

                io.to(gameCode).emit('next_question', { question, session });
                io.to(gameCode).emit('current_state', {
                    currentQuestionIndex: nextIndex,
                    questionData: question,
                    startedAt: session.questionStartedAt,
                });
            }
        };

        // ── Consolidate Auto-Progression Logic ──
        const handleAllAnswered = async (gameCode: string, questionIndex: number) => {
            const session = await GameSession.findOneAndUpdate(
                { gameCode, status: 'question', currentQuestionIndex: questionIndex },
                { status: 'results' },
                { new: true }
            );
            if (!session) return;

            io.to(gameCode).emit('all_answered', { session });

            // Auto-advance after 3 seconds
            setTimeout(async () => {
                // Important: Verify the session is still in 'results' for THIS question before advancing
                const currentSession = await GameSession.findOne({ gameCode });
                if (currentSession && currentSession.status === 'results' && currentSession.currentQuestionIndex === questionIndex) {
                    await advanceGame(gameCode, questionIndex + 1);
                }
            }, 3000);
        };

        // ── Student submits an answer ──
        socket.on('submit_answer', async ({ gameCode, participantId, answer, questionIndex }: {
            gameCode: string; participantId: string; answer: string; questionIndex?: number;
        }) => {
            try {
                const session = await GameSession.findOne({ gameCode })
                    .select('_id quizId status currentQuestionIndex questionStartedAt participants currentQuestionAnswers');

                const targetIndex = questionIndex !== undefined ? questionIndex : session?.currentQuestionIndex;
                if (!session || (session.status !== 'question' && session.status !== 'results')) return;

                if (targetIndex !== session.currentQuestionIndex) {
                    if (targetIndex !== session.currentQuestionIndex - 1) return;
                    const transitionTime = session.questionStartedAt ? new Date(session.questionStartedAt).getTime() : 0;
                    if (Date.now() - transitionTime > 2000) return;
                }

                const now = new Date();
                const startedAt = session.questionStartedAt || now;
                const seconds = Math.max(0, (now.getTime() - new Date(startedAt).getTime()) / 1000);

                if (seconds > 60) return;

                const quiz = await Quiz.findById(session.quizId).select('questions');
                if (!quiz) return;

                const currentQ = quiz.questions[targetIndex ?? 0];
                if (!currentQ) return;

                const cleanAnswer = (answer || '').toString().trim().toUpperCase();
                const cleanCorrect = (currentQ.correctAnswer || '').toString().trim().toUpperCase();
                const isCorrect = cleanAnswer === cleanCorrect;

                let bonus = 0;
                if (isCorrect && seconds <= 10) {
                    bonus = Math.max(0, 1.0 - (seconds / 10));
                    bonus = Number(bonus.toFixed(1));
                    if (bonus > 0.9) bonus = 0.9;
                }
                const pointsEarned = isCorrect ? (10 + bonus) : 0;

                const updateQuery: any = {
                    $set: {
                        'participants.$.hasAnsweredCurrentQuestion': (targetIndex === session.currentQuestionIndex),
                        'participants.$.lastAnswerTimeMs': Math.round(seconds * 1000),
                    },
                    $inc: { 'participants.$.score': pointsEarned },
                    $push: {
                        'participants.$.playerAnswers': {
                            questionIndex: targetIndex,
                            answer,
                            isCorrect,
                            pointsEarned,
                        },
                    },
                };

                if (targetIndex === session.currentQuestionIndex) {
                    updateQuery.$push.currentQuestionAnswers = Math.round(seconds * 1000);
                }

                const updatedSession = await GameSession.findOneAndUpdate(
                    {
                        _id: session._id,
                        participants: {
                            $elemMatch: {
                                _id: participantId,
                                'playerAnswers.questionIndex': { $ne: targetIndex }
                            }
                        }
                    },
                    updateQuery,
                    { returnDocument: 'after', runValidators: true }
                );

                if (!updatedSession) return;

                const totalTimes = updatedSession.currentQuestionAnswers.filter(t => t != null).reduce((sum, t) => sum + (t || 0), 0);
                const avgTimeMs = updatedSession.currentQuestionAnswers.length > 0
                    ? Math.round(totalTimes / updatedSession.currentQuestionAnswers.length)
                    : 0;

                const participant = updatedSession.participants.find((p: any) =>
                    p._id.toString() === participantId || p.id === participantId
                );

                io.to(gameCode).emit('answer_received', {
                    participantId,
                    questionIndex: targetIndex,
                    answer,
                    isCorrect,
                    pointsEarned,
                    timeTakenMs: Math.round(seconds * 1000),
                    newTotalScore: participant ? participant.score : 0,
                    averageTimeMs: avgTimeMs,
                });

                socket.emit('answer_result', {
                    isCorrect,
                    pointsEarned,
                    newTotalScore: participant ? participant.score : 0,
                });

                // Check for all answered
                const activeParticipants = updatedSession.participants.filter((p: any) => p.status !== 'kicked');
                const answeredCount = activeParticipants.filter((p: any) =>
                    p.playerAnswers.some((pa: any) => Number(pa.questionIndex) === Number(session.currentQuestionIndex))
                ).length;

                if (session.status === 'question' && answeredCount >= activeParticipants.length && activeParticipants.length > 0) {
                    await handleAllAnswered(gameCode, session.currentQuestionIndex);
                }
            } catch (error) {
                console.error('[submit_answer]', error);
            }
        });

        // ── Teacher kicks a player ──
        socket.on('kick_player', async ({ gameCode, participantId }: { gameCode: string; participantId: string }) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') return;
                const session = await GameSession.findOne({ gameCode }).select('_id teacherId participants status currentQuestionIndex');
                if (!session || String(session.teacherId) !== String(socket.user._id)) return;

                const participantIndex = session.participants.findIndex((p: any) =>
                    p._id.toString() === participantId || p.id === participantId
                );
                if (participantIndex !== -1) {
                    (session.participants[participantIndex] as any).status = 'kicked';
                    session.markModified('participants');
                    await session.save();

                    const activeParticipants = session.participants.filter((p: any) => p.status !== 'kicked');
                    const answeredCount = activeParticipants.filter((p: any) =>
                        p.playerAnswers.some((pa: any) => Number(pa.questionIndex) === Number(session.currentQuestionIndex))
                    ).length;

                    if (session.status === 'question' && answeredCount >= activeParticipants.length && activeParticipants.length > 0) {
                        await handleAllAnswered(gameCode, session.currentQuestionIndex);
                    }
                    io.to(gameCode).emit('player_kicked', { participantId });
                }
            } catch (error) {
                console.error('[kick_player]', error);
            }
        });

        // ── Student reports a cheating violation ──
        socket.on('cheating_violation', async ({ gameCode, participantId, reason, device_type }: {
            gameCode: string; participantId: string; reason: string; device_type?: string;
        }) => {
            try {
                const updatedSession = await GameSession.findOneAndUpdate(
                    { gameCode, 'participants._id': participantId },
                    { $inc: { 'participants.$.violationCount': 1 } },
                    { returnDocument: 'after' }
                ).select('participants gameCode');

                if (updatedSession) {
                    const participant = updatedSession.participants.find((p: any) =>
                        p._id.toString() === participantId
                    );
                    if (participant) {
                        io.to(gameCode).emit('violation_report', {
                            participantId,
                            name: participant.name,
                            violationCount: participant.violationCount || 0,
                            reason,
                            device_type: device_type || 'unknown',
                        });

                        if ((participant.violationCount ?? 0) >= 5) {
                            await GameSession.updateOne(
                                { gameCode, 'participants._id': participantId },
                                { $set: { 'participants.$.status': 'kicked' } }
                            );
                            io.to(gameCode).emit('player_kicked', {
                                participantId, reason: 'Too many cheating violations',
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('[cheating_violation]', error);
            }
        });

        // ── Teacher reveals results ──
        socket.on('reveal_results', async ({ gameCode }: { gameCode: string }) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') return;
                const session = await GameSession.findOneAndUpdate(
                    { gameCode },
                    { status: 'results' },
                    { returnDocument: 'after' }
                ).select('participants gameCode status');
                if (session) {
                    io.to(gameCode).emit('show_results', { participants: session.participants, session });
                }
            } catch (error) {
                console.error('[reveal_results]', error);
            }
        });

        // ── Teacher ends the game ──
        socket.on('end_game', async ({ gameCode }: { gameCode: string }) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') return;
                await handleEndGame(gameCode);
            } catch (error) {
                console.error('[end_game]', error);
            }
        });

        const handleEndGame = async (gameCode: string) => {
            await GameSession.updateMany(
                { gameCode, 'participants.violationCount': { $gt: 3 } },
                { $set: { 'participants.$[p].disqualified': true } },
                { arrayFilters: [{ 'p.violationCount': { $gt: 3 } }] }
            );

            const session = await GameSession.findOneAndUpdate(
                { gameCode },
                { status: 'ended', endedAt: new Date() },
                { returnDocument: 'after' }
            ).select('_id quizId quizTitle participants gameCode status endedAt');

            if (session) {
                const quiz = await Quiz.findById(session.quizId).select('questions title subject');
                const totalPossiblePoints = quiz ? (quiz.questions.length * 10) : 100;

                const ScoreRecord = (await import('./models/ScoreRecord.js')).default;
                const scorePromises = session.participants.map((p: any) => {
                    const percentage = totalPossiblePoints > 0 ? (p.score / totalPossiblePoints) * 100 : 0;
                    return ScoreRecord.create({
                        userId: p.userId || p.name,
                        quizId: session.quizId.toString(),
                        quizTitle: quiz?.title || 'Unknown Quiz',
                        score: p.disqualified ? 0 : p.score,
                        total: totalPossiblePoints,
                        percentage: p.disqualified ? 0 : Math.min(100, Math.round(percentage)),
                        subject: (quiz?.subject || 'General') as any,
                        completedAt: new Date(),
                        violationCount: p.violationCount || 0,
                        disqualified: p.disqualified || false,
                    });
                });
                await Promise.allSettled(scorePromises);

                const finalAnswers: any[] = [];
                session.participants.forEach((p: any) => {
                    (p.playerAnswers || []).forEach((a: any) => {
                        finalAnswers.push({
                            participantId: p._id.toString(),
                            questionIndex: a.questionIndex,
                            answer: a.answer,
                            isCorrect: a.isCorrect,
                            pointsEarned: a.pointsEarned,
                            timeTakenMs: p.lastAnswerTimeMs || 0,
                        });
                    });
                });

                quizStateMap.delete(gameCode);

                io.to(gameCode).emit('game_ended', {
                    finalParticipants: session.participants,
                    finalAnswers,
                    session,
                });
            }
        };

        // ── Disconnect ──
        socket.on('disconnect', () => {
            if (socket.gameCode) {
                socket.leave(socket.gameCode);
                if (socket.participantId) {
                    io.to(socket.gameCode).emit('player_left', {
                        socketId: socket.id,
                        participantId: socket.participantId,
                    });
                }
            }
        });
    });

    return io;
};
