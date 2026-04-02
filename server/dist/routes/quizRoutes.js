import express from 'express';
import Quiz from '../models/Quiz.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
const router = express.Router();
// Create Quiz
router.post('/', protect, authorize('teacher'), async (req, res) => {
    try {
        const { title, description, subject, timerEnabled, timerSeconds, questions, status } = req.body;
        const quiz = await Quiz.create({
            teacherId: req.user._id, // Set from auth middleware
            title,
            description,
            subject,
            timerEnabled,
            timerSeconds,
            questions,
            isActive: status === 'published',
        });
        res.status(201).json(quiz);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Update Quiz
router.put('/:id', protect, authorize('teacher'), async (req, res) => {
    try {
        const { title, description, subject, timerEnabled, timerSeconds, questions, status } = req.body;
        const updateData = { title, description, subject, timerEnabled, timerSeconds, questions };
        if (status) {
            updateData.isActive = status === 'published';
        }
        const quiz = await Quiz.findOneAndUpdate({ _id: req.params.id, teacherId: req.user._id }, updateData, { new: true });
        if (quiz) {
            res.json(quiz);
        }
        else {
            res.status(404).json({ message: 'Quiz not found or not authorized' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get My Quizzes (Teacher) with Stats
router.get('/teacher/my-quizzes', protect, authorize('teacher'), async (req, res) => {
    try {
        const mongoose = (await import('mongoose')).default;
        const quizzes = await Quiz.aggregate([
            { $match: { teacherId: new mongoose.Types.ObjectId(req.user._id) } },
            {
                $lookup: {
                    from: 'scorerecords',
                    let: { quizIdStr: { $toString: '$_id' } },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$quizId', '$$quizIdStr'] } } }
                    ],
                    as: 'records'
                }
            },
            {
                $project: {
                    title: 1,
                    subject: 1,
                    isActive: { $ifNull: ['$isActive', false] },
                    createdAt: 1,
                    questionCount: { $size: '$questions' },
                    attempts: { $size: '$records' },
                    avgScore: {
                        $cond: {
                            if: { $gt: [{ $size: '$records' }, 0] },
                            then: { $avg: '$records.percentage' },
                            else: 0
                        }
                    },
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);
        res.json(quizzes);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Delete Quiz
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
    try {
        const quiz = await Quiz.findOneAndDelete({
            _id: req.params.id,
            teacherId: req.user._id
        });
        if (quiz) {
            res.json({ message: 'Quiz deleted successfully' });
        }
        else {
            res.status(404).json({ message: 'Quiz not found or not authorized' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get Teacher Quizzes (Public/Admin)
router.get('/teacher/:teacherId', protect, async (req, res) => {
    try {
        // Teachers can see their own, admins could see all, etc.
        if (req.user.role !== 'admin' && req.user._id !== req.params.teacherId) {
            return res.status(403).json({ message: 'Not authorized to view these quizzes' });
        }
        const quizzes = await Quiz.find({ teacherId: req.params.teacherId });
        res.json(quizzes);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get All Quizzes (for student browsing)
router.get('/', async (req, res) => {
    try {
        const quizzes = await Quiz.find({ isActive: true });
        res.json(quizzes);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Get Single Quiz
router.get('/:id', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (quiz) {
            res.json(quiz);
        }
        else {
            res.status(404).json({ message: 'Quiz not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export default router;
//# sourceMappingURL=quizRoutes.js.map