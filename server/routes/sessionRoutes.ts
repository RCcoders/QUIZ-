import express from 'express';
import GameSession from '../models/GameSession.js';
import Quiz from '../models/Quiz.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate a random 6-character code
const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Host a Session
// @desc    Host a new game session
// @route   POST /api/sessions/host
router.post('/host', protect, authorize('teacher'), async (req: any, res) => {
    try {
        const { quizId, quizTitle } = req.body;

        // Logic update: We no longer reuse 'waiting' sessions to ensure fresh game codes
        // and prevent participant duplication from previous orphaned sessions.
        // The front-end will handle creating a new session each time the host button is clicked.

        // Generate a random 6-character game code
        const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const session = await GameSession.create({
            quizId,
            quizTitle,
            teacherId: req.user._id,
            gameCode,
            status: 'waiting',
            participants: [],
        });

        res.status(201).json(session);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Join a Session
router.post('/join', async (req: any, res: any) => {
    try {
        const { gameCode, name, userId } = req.body;
        const session = await GameSession.findOne({ gameCode });

        if (!session) {
            return res.status(404).json({ message: 'Session not found. Invalid code.' });
        }

        if (session.status !== 'waiting') {
            return res.status(400).json({ message: 'Game has already started or ended.' });
        }

        // Prevent duplicate participants by name or userId
        const duplicate = session.participants.find((p: any) =>
            p.name.toLowerCase() === name.toLowerCase() ||
            (userId && p.userId?.toString() === userId.toString())
        );

        if (duplicate) {
            // If participant exists, return current session state rather than adding dynamic duplicate
            return res.json(session);
        }

        // Add participant
        session.participants.push({
            name,
            userId: userId || undefined,
            score: 0,
            joinedAt: new Date()
        });

        await session.save();
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// Get Session by Code
router.get('/code/:code', async (req: any, res: any) => {
    try {
        const session = await GameSession.findOne({ gameCode: req.params.code })
            .populate('quizId');
        if (!session) return res.status(404).json({ message: 'Session not found' });
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// Update Session Status
router.patch('/:id', protect, authorize('teacher'), async (req: any, res) => {
    try {
        const { status, currentQuestionIndex } = req.body;
        const session = await GameSession.findById(req.params.id);

        if (!session) return res.status(404).json({ message: 'Session not found' });

        // Ensure teacher ownership
        if (session.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to manage this session' });
        }

        if (status) session.status = status;
        if (currentQuestionIndex !== undefined) session.currentQuestionIndex = currentQuestionIndex;

        await session.save();
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// Submit Answer
router.post('/:id/answer', async (req: any, res: any) => {
    try {
        const { participantId, pointsEarned } = req.body;
        const session = await GameSession.findById(req.params.id).populate('quizId');


        if (!session) return res.status(404).json({ message: 'Session not found' });

        const participant = session.participants.find((p: any) => p._id.toString() === participantId || p.id === participantId);
        if (!participant) return res.status(404).json({ message: 'Participant not found' });

        participant.score += pointsEarned;
        await session.save();

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

export default router;
