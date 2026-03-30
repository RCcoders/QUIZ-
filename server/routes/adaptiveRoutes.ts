import express from 'express';
import { generateAdaptiveQuiz, generateQuestionsFromText } from '../services/adaptiveService.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/adaptive/generate
router.post('/generate', protect, async (req: any, res) => {
    try {
        const { subject, topic, difficulty, count } = req.body;
        const questions = await generateAdaptiveQuiz(req.user._id, subject, topic, difficulty, count);
        res.json({ questions });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Generate questions from text (for Quiz Editor)
// @route   POST /api/adaptive/generate-from-text
router.post('/generate-from-text', protect, authorize('teacher'), async (req: any, res) => {
    try {
        const { text, count } = req.body;
        const questions = await generateQuestionsFromText(text, count);
        res.json({ questions });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
