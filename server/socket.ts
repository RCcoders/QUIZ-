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

                const session = await GameSession.findOne({ gameCode })
                    .select('_id quizId teacherId participants status currentQuestionIndex questionStartedAt currentQuestionAnswers');
                if (!session || String(session.teacherId) !== String(socket.user._id)) return;

                session.status = 'question';
                session.currentQuestionIndex = nextIndex;
                session.questionStartedAt = new Date();
                session.currentQuestionAnswers = [];

                if (session.participants) {
                    session.participants.forEach((p: any) => { p.hasAnsweredCurrentQuestion = false; });
                }
                session.markModified('participants');
                await session.save();

                const quiz = await Quiz.findById(session.quizId).select('questions title subject');
                const question = quiz ? quiz.questions[nextIndex] : null;

                // Update server-side quiz state
                quizStateMap.set(gameCode, {
                    quizId: String(session.quizId),
                    currentQuestionIndex: nextIndex,
                    questionData: question,
                    startedAt: session.questionStartedAt,
                });

                // Ack the teacher socket so UI can re-enable the Next button
                socket.emit('ack_next_question', { nextIndex });

                // Broadcast authoritative state to all students
                io.to(gameCode).emit('next_question', { question, session });
                io.to(gameCode).emit('current_state', {
                    currentQuestionIndex: nextIndex,
                    questionData: question,
                    startedAt: session.questionStartedAt,
                });
            } catch (error) {
                console.error('[next_question]', error);
            }
        });

        // ── Student submits an answer ──
        socket.on('submit_answer', async ({ gameCode, participantId, answer }: {
            gameCode: string; participantId: string; answer: string;
        }) => {
            try {
                const session = await GameSession.findOne({ gameCode })
                    .select('_id quizId status currentQuestionIndex questionStartedAt participants currentQuestionAnswers');
                if (!session || session.status !== 'question') return;

                const now = new Date();
                const startedAt = session.questionStartedAt || now;
                const seconds = Math.max(0, (now.getTime() - new Date(startedAt).getTime()) / 1000);

                if (seconds > 30) {
                    return socket.emit('answer_result', { isCorrect: false, pointsEarned: 0, reason: 'Time exceeded' });
                }

                const quiz = await Quiz.findById(session.quizId).select('questions');
                if (!quiz) return;

                const currentQ = quiz.questions[session.currentQuestionIndex];
                if (!currentQ) return;

                const isCorrect = answer === currentQ.correctAnswer;

                let bonus = 0;
                if (isCorrect && seconds <= 10) {
                    bonus = Math.max(0, 1.0 - (seconds / 10));
                    bonus = Number(bonus.toFixed(1));
                    if (bonus > 0.9) bonus = 0.9;
                }
                const pointsEarned = isCorrect ? (10 + bonus) : 0;

                const updatedSession = await GameSession.findOneAndUpdate(
                    {
                        _id: session._id,
                        'participants._id': participantId,
                        'participants.hasAnsweredCurrentQuestion': false,
                    },
                    {
                        $set: {
                            'participants.$.hasAnsweredCurrentQuestion': true,
                            'participants.$.lastAnswerTimeMs': Math.round(seconds * 1000),
                        },
                        $inc: { 'participants.$.score': pointsEarned },
                        $push: {
                            currentQuestionAnswers: Math.round(seconds * 1000),
                            'participants.$.playerAnswers': {
                                questionIndex: session.currentQuestionIndex,
                                answer,
                                isCorrect,
                                pointsEarned,
                            },
                        },
                    },
                    { returnDocument: 'after', runValidators: true }
                );

                if (!updatedSession) {
                    return socket.emit('answer_result', {
                        isCorrect: false, pointsEarned: 0, reason: 'Already answered or session mismatch',
                    });
                }

                const totalTimes = updatedSession.currentQuestionAnswers.reduce((sum, t) => sum + (t || 0), 0);
                const avgTimeMs = updatedSession.currentQuestionAnswers.length > 0
                    ? Math.round(totalTimes / updatedSession.currentQuestionAnswers.length)
                    : 0;

                const participant = updatedSession.participants.find((p: any) =>
                    p._id.toString() === participantId || p.id === participantId
                );

                io.to(gameCode).emit('answer_received', {
                    participantId,
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

                const activeParticipants = updatedSession.participants.filter((p: any) => p.status !== 'kicked');
                const answeredCount = activeParticipants.filter((p: any) => p.hasAnsweredCurrentQuestion).length;
                if (answeredCount >= activeParticipants.length && activeParticipants.length > 0) {
                    io.to(gameCode).emit('all_answered', { session: updatedSession });
                }
            } catch (error) {
                console.error('[submit_answer]', error);
            }
        });

        // ── Teacher kicks a player ──
        socket.on('kick_player', async ({ gameCode, participantId }: { gameCode: string; participantId: string }) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') return;
                const session = await GameSession.findOne({ gameCode }).select('_id teacherId participants');
                if (!session || String(session.teacherId) !== String(socket.user._id)) return;

                const participantIndex = session.participants.findIndex((p: any) =>
                    p._id.toString() === participantId || p.id === participantId
                );
                if (participantIndex !== -1) {
                    (session.participants[participantIndex] as any).status = 'kicked';
                    session.markModified('participants');
                    await session.save();
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

                // Mark disqualified BEFORE updating status so the flag is persisted
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
                            // Disqualified students get score=0 in the record
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

                    // Build a flat finalAnswers array from all participants' playerAnswers
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

                    // Clean up in-memory state for this game
                    quizStateMap.delete(gameCode);

                    io.to(gameCode).emit('game_ended', {
                        finalParticipants: session.participants,
                        finalAnswers,
                        session,
                    });
                }
            } catch (error) {
                console.error('[end_game]', error);
            }
        });

        // ── Disconnect: clean up room membership & timers ──
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
