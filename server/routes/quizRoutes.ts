import express from 'express';
import Quiz from '../models/Quiz.js';


const router = express.Router();

// Create Quiz
router.post('/', async (req, res) => {
    try {
        const { teacherId, title, description, subject, timerEnabled, timerSeconds, questions } = req.body;
        const quiz = await Quiz.create({
            teacherId,
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

// Get Teacher Quizzes
router.get('/teacher/:teacherId', async (req, res) => {
    try {
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
