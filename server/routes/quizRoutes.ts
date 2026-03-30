import express from 'express';
import Quiz from '../models/Quiz.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create Quiz
router.post('/', protect, authorize('teacher'), async (req: any, res) => {
    try {
        const { title, description, subject, timerEnabled, timerSeconds, questions } = req.body;
        const quiz = await Quiz.create({
            teacherId: req.user._id, // Set from auth middleware
            title,
            description,
            subject,
            timerEnabled,
            timerSeconds,
            questions,
        });
        res.status(201).json(quiz);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// Get My Quizzes (Teacher)
router.get('/teacher/my-quizzes', protect, authorize('teacher'), async (req: any, res) => {
    try {
        const quizzes = await Quiz.find({ teacherId: req.user._id });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// Get Teacher Quizzes (Public/Admin)
router.get('/teacher/:teacherId', protect, async (req: any, res) => {
    try {
        // Teachers can see their own, admins could see all, etc.
        if (req.user.role !== 'admin' && req.user._id !== req.params.teacherId) {
            return res.status(403).json({ message: 'Not authorized to view these quizzes' });
        }
        const quizzes = await Quiz.find({ teacherId: req.params.teacherId });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// Get All Quizzes (for student browsing)
router.get('/', async (req, res) => {
    try {
        const quizzes = await Quiz.find({ isActive: true });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// Get Single Quiz
router.get('/:id', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (quiz) {
            res.json(quiz);
        } else {
            res.status(404).json({ message: 'Quiz not found' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

export default router;
