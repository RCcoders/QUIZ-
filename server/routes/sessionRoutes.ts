import express from 'express';
import GameSession from '../models/Session.js';
import Quiz from '../models/Quiz.js';

const router = express.Router();

// Generate a random 6-character code
const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Host a Session
router.post('/host', async (req, res) => {
    try {
        const { quizId, teacherId } = req.body;

        // Check if quiz exists
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        let gameCode = generateCode();
        let codeExists = await GameSession.findOne({ gameCode });

        // Ensure unique code
        while (codeExists) {
            gameCode = generateCode();
            codeExists = await GameSession.findOne({ gameCode });
        }

        const session = await GameSession.create({
            quizId,
            teacherId,
            gameCode,
            status: 'waiting',
            participants: [],
            currentQuestionIndex: 0
        });

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// Join a Session
router.post('/join', async (req, res) => {
    try {
        const { gameCode, name, userId } = req.body;
        const session = await GameSession.findOne({ gameCode });

        if (!session) {
            return res.status(404).json({ message: 'Session not found. Invalid code.' });
        }

        if (session.status !== 'waiting') {
            return res.status(400).json({ message: 'Game has already started or ended.' });
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
router.get('/code/:code', async (req, res) => {
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
router.patch('/:id', async (req, res) => {
    try {
        const { status, currentQuestionIndex } = req.body;
        const session = await GameSession.findByIdAndUpdate(
            req.params.id,
            { status, currentQuestionIndex },
            { new: true }
        );
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// Submit Answer
router.post('/:id/answer', async (req, res) => {
    try {
        const { participantId, pointsEarned } = req.body;
        const session = await GameSession.findById(req.params.id).populate('quizId');


        if (!session) return res.status(404).json({ message: 'Session not found' });

        const participant = session.participants.id(participantId);
        if (!participant) return res.status(404).json({ message: 'Participant not found' });

        participant.score += pointsEarned;
        await session.save();

        res.json(session);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

export default router;
