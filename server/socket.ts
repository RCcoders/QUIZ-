import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import GameSession from './models/GameSession.js';
import Quiz from './models/Quiz.js';

interface SocketWithUser extends Socket {
    user?: {
        _id: string;
        role: string;
    };
    gameCode?: string;
    participantId?: string;
}

export const setupSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Middleware to verify JWT token
    io.use((socket: SocketWithUser, next) => {
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

    io.on('connection', (socket: SocketWithUser) => {
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
                socket.participantId = participantId;

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
                if (!session || session.teacherId.toString() !== socket.user._id.toString()) {
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
                if (!session || session.teacherId.toString() !== socket.user._id.toString()) return;

                session.status = 'question';
                session.currentQuestionIndex = nextIndex;
                session.questionStartedAt = new Date();
                await session.save();

                const quiz = await Quiz.findById(session.quizId);
                const question = quiz ? quiz.questions[nextIndex] : null;

                io.to(gameCode).emit('next_question', { question, session });
            } catch (error) {
                console.error('Next question error:', error);
            }
        });

        // Student submits an answer
        socket.on('submit_answer', async ({ gameCode, participantId, answer, isCorrect, timeTakenMs }: {
            gameCode: string;
            participantId: string;
            answer: string;
            isCorrect: boolean;
            timeTakenMs: number;
        }) => {
            try {
                const session = await GameSession.findOne({ gameCode });
                if (!session) return;

                // Point Allocation Logic
                const basePoints = 10;
                let bonus = 0;
                if (isCorrect) {
                    const seconds = timeTakenMs / 1000;
                    // Formula: 1s -> 1.0, 2s -> 0.8... step 0.2
                    // bonus = Max(0, 1.2 - (seconds * 0.2))
                    if (seconds <= 10) {
                        bonus = Math.max(0, 1.2 - (seconds * 0.2));
                    }
                }
                const pointsEarned = isCorrect ? (basePoints + Number(bonus.toFixed(1))) : 0;

                // Update participant in DB
                const participant = session.participants.find((p: any) =>
                    p._id.toString() === participantId || p.id === participantId
                );

                if (participant) {
                    participant.score = (participant.score || 0) + pointsEarned;
                    await session.save();
                }

                // Notify room (teacher and other students)
                io.to(gameCode).emit('answer_received', {
                    participantId,
                    answer,
                    isCorrect,
                    pointsEarned,
                    timeTakenMs,
                    newTotalScore: participant ? participant.score : 0
                });

                // Specifically notify the student of their result
                socket.emit('answer_result', {
                    isCorrect,
                    pointsEarned,
                    newTotalScore: participant ? participant.score : 0
                });

            } catch (error) {
                console.error('Submit answer error:', error);
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
                    const totalPossiblePoints = quiz ? (quiz.questions.length * 11) : 100;

                    // Create score records for all participants
                    const ScoreRecord = (await import('./models/ScoreRecord.js')).default;
                    const scorePromises = session.participants.map(p => {
                        const percentage = totalPossiblePoints > 0 ? (p.score / totalPossiblePoints) * 100 : 0;
                        return ScoreRecord.create({
                            userId: p.userId || p.name, // Corrected from p.id
                            quizId: session.quizId.toString(),
                            quizTitle: quiz?.title || 'Unknown Quiz',
                            score: p.score,
                            total: totalPossiblePoints,
                            percentage: Math.min(100, Math.round(percentage)),
                            subject: (quiz?.subject as any), // Cast to bypass StringQueryTypeCasting error
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
