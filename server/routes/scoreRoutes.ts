import express from 'express';
import ScoreRecord from '../models/ScoreRecord.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Save score record
// @route   POST /api/scores
router.post('/', protect, async (req: any, res) => {
    try {
        const { quizId, quizTitle, score, total, percentage, subject, timeTakenMs } = req.body;
        const userId = req.user._id;

        const record = await ScoreRecord.create({
            userId,
            quizId,
            quizTitle,
            score,
            total,
            percentage,
            subject,
            timeTakenMs
        });

        // Update user's last active date and potentially streak (simplified for now)
        await User.findOneAndUpdate(
            { _id: userId },
            {
                lastActiveDate: new Date().toISOString().split('T')[0],
                $inc: { streak: 1 } // Simple increment, real streak logic would check last active date
            }
        );

        res.status(201).json(record);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get student's score records
// @route   GET /api/scores/:userId
router.get('/:userId', protect, async (req: any, res) => {
    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
            return res.status(403).json({ message: 'Not authorized to view these records' });
        }
        const records = await ScoreRecord.find({ userId: req.params.userId })
            .sort({ completedAt: -1 })
            .lean() as any[];
        res.json(records);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get student stats summary
// @route   GET /api/scores/:userId/stats
router.get('/:userId/stats', protect, async (req: any, res) => {
    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
            return res.status(403).json({ message: 'Not authorized to view these stats' });
        }
        const userId = req.params.userId;
        const records = await ScoreRecord.find({ userId }).lean() as any[];

        const totalCompleted = records.length;
        const averageScore = totalCompleted > 0
            ? Math.round(records.reduce((acc, r) => acc + r.percentage, 0) / totalCompleted)
            : 0;

        // Simplified streak calculation logic
        const user = await User.findById(userId).lean() as any;

        res.json({
            totalCompleted,
            averageScore,
            streak: user?.streak || 0,
            records: records.slice(0, 5) // Recent 5 records
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
