import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import GameSession from './models/GameSession.js';
import Quiz from './models/Quiz.js';

// Socket properties are augmented in types/socket.d.ts

export const setupSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Middleware to verify JWT token
    io.use((socket: Socket, next: (err?: Error) => void) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next();
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            socket.user = {
                _id: decoded.id,
                role: decoded.role
            };
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id, 'Role:', socket.user?.role || 'Guest');

        // Generic room join (for teachers/hosts)
        socket.on('join_room', ({ gameCode }: { gameCode: string }) => {
            socket.join(gameCode);
            socket.gameCode = gameCode;
            console.log(`Socket ${socket.id} joined room: ${gameCode} (Host/Observer)`);
        });

        // Join a game room (for students/players)
        socket.on('join_game', async ({ gameCode, name, userId, participantId }: { gameCode: string; name: string; userId?: string; participantId?: string }) => {
            console.log(`Join attempt: ${name} (ID: ${participantId}) for code ${gameCode}`);
            try {
                // Allow joining if session exists (waiting, playing, or results)
                const session = await GameSession.findOne({ gameCode });
                if (!session || session.status === 'ended') {
                    socket.emit('error', { message: 'Session not found or already ended' });
                    return;
                }

                // Fetch questions for the session
                const quiz = await Quiz.findById(session.quizId);
                const questions = quiz ? quiz.questions : [];

                socket.join(gameCode);
                socket.gameCode = gameCode;
                socket.participantId = (participantId as string) || '';

                console.log(`${name} (${participantId || 'Guest'}) joined room: ${gameCode}`);

                // Notify room members
                io.to(gameCode).emit('player_joined', { name, userId, socketId: socket.id, participantId });

                // Send current session state and questions to the new player
                socket.emit('session_state', { session, questions });
            } catch (error) {
                console.error('Join game error:', error);
                socket.emit('error', { message: 'Internal server error' });
            }
        });

        // Teacher starts the game
        socket.on('start_game', async ({ gameCode }: { gameCode: string }) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') {
                    return socket.emit('error', { message: 'Only teachers can start the game' });
                }

                const session = await GameSession.findOne({ gameCode });
                if (!session || String(session.teacherId) !== String(socket.user._id)) {
                    return socket.emit('error', { message: 'Unauthorized to start this session' });
                }

                // Transition directly to the first question
                session.status = 'question';
                session.currentQuestionIndex = 0;
                session.questionStartedAt = new Date();
                await session.save();

                io.to(gameCode).emit('game_started', session);
            } catch (error) {
                console.error('Start game error:', error);
            }
        });

        // Teacher moves to next question
        socket.on('next_question', async ({ gameCode, nextIndex }: { gameCode: string; nextIndex: number }) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') return;

                const session = await GameSession.findOne({ gameCode });
                if (!session || String(session.teacherId) !== String(socket.user._id)) return;

                session.status = 'question';
                session.currentQuestionIndex = nextIndex;
                session.questionStartedAt = new Date();
                session.currentQuestionAnswers = []; // Reset for next question

                // ── Task 2: Reset Answer Guards ──
                if (session.participants) {
                    session.participants.forEach((p: any) => {
                        p.hasAnsweredCurrentQuestion = false;
                    });
                }

                session.markModified('participants');
                await session.save();

                const quiz = await Quiz.findById(session.quizId);
                const question = quiz ? quiz.questions[nextIndex] : null;

                io.to(gameCode).emit('next_question', { question, session });
            } catch (error) {
                console.error('Next question error:', error);
            }
        });

        // Student submits an answer
        socket.on('submit_answer', async ({ gameCode, participantId, answer }: {
            gameCode: string;
            participantId: string;
            answer: string;
        }) => {
            try {
                const session = await GameSession.findOne({ gameCode });
                if (!session || session.status !== 'question') return;

                // ── Task 1: Server-Side Timing Calculation ──
                const now = new Date();
                const startedAt = session.questionStartedAt || now;
                const seconds = Math.max(0, (now.getTime() - new Date(startedAt).getTime()) / 1000);

                // ── Task 3: Graceful Timeout Handling ──
                if (seconds > 30) {
                    return socket.emit('answer_result', {
                        isCorrect: false,
                        pointsEarned: 0,
                        reason: 'Time exceeded'
                    });
                }

                const quiz = await Quiz.findById(session.quizId);
                if (!quiz) return;

                const currentQ = quiz.questions[session.currentQuestionIndex];
                if (!currentQ) return;

                const isCorrect = answer === currentQ.correctAnswer;

                // ── Task 4: Detailed Scoring Logic ──
                let bonus = 0;
                if (isCorrect && seconds <= 10) {
                    // Formula: bonus = max(0, 1.0 - (timeTaken / 10))
                    bonus = Math.max(0, 1.0 - (seconds / 10));
                    // Round to 1 decimal place
                    bonus = Number(bonus.toFixed(1));
                    // Clamp between 0 and 0.9
                    if (bonus > 0.9) bonus = 0.9;
                }

                const pointsEarned = isCorrect ? (10 + bonus) : 0;
                console.log(`[SCORING] participant: ${participantId}, time: ${seconds}s, bonus: ${bonus}, points: ${pointsEarned}`);

                // Update participant in DB
                const participant = session.participants.find((p: any) =>
                    p._id.toString() === participantId || p.id === participantId
                );

                if (participant) {
                    // ── Task 2: Multiple Submission Guard ──
                    if (participant) {
                        // Update the session document atomically
                        const updatedSession = await GameSession.findOneAndUpdate(
                            {
                                _id: session._id,
                                "participants._id": participantId,
                                "participants.hasAnsweredCurrentQuestion": false // Guard against double submission
                            },
                            {
                                $set: {
                                    "participants.$.hasAnsweredCurrentQuestion": true,
                                    "participants.$.lastAnswerTimeMs": Math.round(seconds * 1000)
                                },
                                $inc: {
                                    "participants.$.score": pointsEarned
                                },
                                $push: {
                                    currentQuestionAnswers: Math.round(seconds * 1000)
                                }
                            },
                            { new: true, runValidators: true }
                        );

                        if (!updatedSession) {
                            // If findOneAndUpdate returns null, it means either the document wasn't found
                            // or the guard 'hasAnsweredCurrentQuestion: false' failed.
                            return socket.emit('answer_result', {
                                isCorrect: false,
                                pointsEarned: 0,
                                reason: 'Already answered or session mismatch'
                            });
                        }

                        // Calculate class average from the updated session
                        const totalTimes = updatedSession.currentQuestionAnswers.reduce((sum, t) => sum + (t || 0), 0);
                        const avgTimeMs = updatedSession.currentQuestionAnswers.length > 0
                            ? Math.round(totalTimes / updatedSession.currentQuestionAnswers.length)
                            : 0;

                        // Notify room
                        io.to(gameCode).emit('answer_received', {
                            participantId,
                            answer,
                            isCorrect,
                            pointsEarned,
                            timeTakenMs: Math.round(seconds * 1000),
                            newTotalScore: (participant.score || 0) + pointsEarned,
                            averageTimeMs: avgTimeMs
                        });

                        // Check if all active participants have answered
                        const activeParticipants = updatedSession.participants.filter((p: any) => p.status !== 'kicked');
                        const answeredCount = activeParticipants.filter((p: any) => p.hasAnsweredCurrentQuestion).length;

                        if (answeredCount >= activeParticipants.length && activeParticipants.length > 0) {
                            io.to(gameCode).emit('all_answered', { session: updatedSession });
                        }
                    }

                    // Specifically notify the student of their result
                    socket.emit('answer_result', {
                        isCorrect,
                        pointsEarned,
                        newTotalScore: participant ? participant.score : 0
                    });
                }
            } catch (error) {
                console.error('Submit answer error:', error);
            }
        });

        // Teacher kicks a player
        socket.on('kick_player', async ({ gameCode, participantId }: { gameCode: string; participantId: string }) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') return;

                const session = await GameSession.findOne({ gameCode });
                if (!session || String(session.teacherId) !== String(socket.user._id)) return;

                const participantIndex = session.participants.findIndex((p: any) =>
                    p._id.toString() === participantId || p.id === participantId
                );

                if (participantIndex !== -1) {
                    const participant = session.participants[participantIndex];
                    // Instead of removing, mark as kicked to keep history
                    (participant as any).status = 'kicked';
                    session.markModified('participants');
                    await session.save();

                    // Notify the room and specifically the kicked player
                    io.to(gameCode).emit('player_kicked', { participantId });
                    console.log(`Player ${participantId} kicked from room ${gameCode}`);
                }
            } catch (error) {
                console.error('Kick player error:', error);
            }
        });

        // Student reports a cheating violation
        socket.on('cheating_violation', async ({ gameCode, participantId, reason }: { gameCode: string; participantId: string; reason: string }) => {
            try {
                const updatedSession = await GameSession.findOneAndUpdate(
                    {
                        gameCode,
                        "participants._id": participantId
                    },
                    {
                        $inc: { "participants.$.violationCount": 1 }
                    },
                    { new: true }
                );

                if (updatedSession) {
                    const participant = updatedSession.participants.find((p: any) =>
                        p._id.toString() === participantId
                    );

                    if (participant) {
                        // Notify teacher
                        io.to(gameCode).emit('violation_report', {
                            participantId,
                            name: participant.name,
                            violationCount: participant.violationCount || 0,
                            reason
                        });

                        // Auto-kick if violations >= 5 (Increased from 3 for more stability in 150+ student tests)
                        // Auto-kick if violations >= 5
                        if ((participant.violationCount ?? 0) >= 5) {
                            await GameSession.updateOne(
                                { gameCode, "participants._id": participantId },
                                { $set: { "participants.$.status": 'kicked' } }
                            );
                            io.to(gameCode).emit('player_kicked', { participantId, reason: 'Too many cheating violations' });
                        }
                    }
                }
            } catch (error) {
                console.error('Cheating violation error:', error);
            }
        });

        // Teacher reveals results
        socket.on('reveal_results', async ({ gameCode }: { gameCode: string }) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') return;

                const session = await GameSession.findOneAndUpdate(
                    { gameCode },
                    { status: 'results' },
                    { new: true }
                );
                if (session) {
                    io.to(gameCode).emit('show_results', { participants: session.participants, session });
                }
            } catch (error) {
                console.error('Reveal results error:', error);
            }
        });

        // Teacher ends the game
        socket.on('end_game', async ({ gameCode }: { gameCode: string }) => {
            try {
                if (!socket.user || socket.user.role !== 'teacher') return;

                const session = await GameSession.findOneAndUpdate(
                    { gameCode },
                    { status: 'ended', endedAt: new Date() },
                    { new: true }
                );

                if (session) {
                    const quiz = await Quiz.findById(session.quizId);
                    const totalPossiblePoints = quiz ? (quiz.questions.length * 10) : 100;

                    // Create score records for all participants
                    const ScoreRecord = (await import('./models/ScoreRecord.js')).default;
                    const scorePromises = session.participants.map((p: any) => {
                        const percentage = totalPossiblePoints > 0 ? (p.score / totalPossiblePoints) * 100 : 0;
                        return ScoreRecord.create({
                            userId: p.userId || p.name, // Corrected from p.id
                            quizId: session.quizId.toString(),
                            quizTitle: quiz?.title || 'Unknown Quiz',
                            score: p.score,
                            total: totalPossiblePoints,
                            percentage: Math.min(100, Math.round(percentage)),
                            subject: (quiz?.subject || 'General') as any, // Cast to bypass StringQueryTypeCasting error
                            completedAt: new Date()
                        });
                    });

                    await Promise.allSettled(scorePromises);

                    io.to(gameCode).emit('game_ended', { finalParticipants: session.participants, session });
                }
            } catch (error) {
                console.error('End game error:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id, 'Name:', socket.participantId);
            if (socket.gameCode && socket.participantId) {
                // Notify room about student departure
                io.to(socket.gameCode).emit('player_left', {
                    socketId: socket.id,
                    participantId: socket.participantId
                });
            }
        });
    });

    return io;
};
