/**
 * aiRoutes.ts
 *
 * Routes that proxy to the Python AI service (api.py / question_generator.py).
 *
 * Teacher routes:
 *   POST /api/ai/quiz          — role-specific quiz generator (QUIZ_GENERATOR mode)
 *
 * Student routes:
 *   POST /api/ai/notes         — notes generator (NOTES_GENERATOR mode)
 *   POST /api/ai/adaptive      — adaptive quiz from weak topics (ADAPTIVE_QUIZ mode)
 */

import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    generateQuizFromTopic,
    generateNotesForTopic,
    generateAdaptiveQuizFromWeakTopics,
} from '../services/pythonAiService.js';

const router = express.Router();

// ── Teacher: generate quiz from topic ────────────────────────────────────────
// POST /api/ai/quiz
router.post('/quiz', protect, authorize('teacher'), async (req: any, res) => {
    try {
        const { topic, num_questions = 5, difficulty = 'medium' } = req.body;

        if (!topic?.trim()) {
            return res.status(400).json({ message: 'topic is required' });
        }

        const questions = await generateQuizFromTopic(topic, num_questions, difficulty);
        return res.json({ questions });
    } catch (err: any) {
        console.error('[AI /quiz]', err.message);
        return res.status(500).json({ message: err.message || 'Failed to generate quiz' });
    }
});

// ── Student: generate notes for a topic ──────────────────────────────────────
// POST /api/ai/notes
router.post('/notes', protect, authorize('student'), async (req: any, res) => {
    try {
        const { topic } = req.body;

        if (!topic?.trim()) {
            return res.status(400).json({ message: 'topic is required' });
        }

        const notes = await generateNotesForTopic(topic);
        return res.json({ notes });
    } catch (err: any) {
        console.error('[AI /notes]', err.message);
        return res.status(500).json({ message: err.message || 'Failed to generate notes' });
    }
});

// ── Student: adaptive quiz from weak topics ───────────────────────────────────
// POST /api/ai/adaptive
router.post('/adaptive', protect, authorize('student'), async (req: any, res) => {
    try {
        const { weak_topics, num_questions = 5 } = req.body;

        if (!Array.isArray(weak_topics) || weak_topics.length === 0) {
            return res.status(400).json({ message: 'weak_topics array is required' });
        }

        const questions = await generateAdaptiveQuizFromWeakTopics(weak_topics, num_questions);
        return res.json({ questions });
    } catch (err: any) {
        console.error('[AI /adaptive]', err.message);
        return res.status(500).json({ message: err.message || 'Failed to generate adaptive quiz' });
    }
});

export default router;
