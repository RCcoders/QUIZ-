import express from 'express';
import Badge from '../models/Badge.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();
// @desc    Award badge
// @route   POST /api/badges
router.post('/', protect, async (req, res) => {
    try {
        const { badgeId, quizId } = req.body;
        // Check if badge already exists for this user (some might be unique)
        const existing = await Badge.findOne({ userId: req.user._id, badgeId });
        if (existing && !['perfect_score', 'improvement'].includes(badgeId)) {
            return res.status(400).json({ message: 'Badge already awarded' });
        }
        const badge = await Badge.create({
            userId: req.user._id,
            badgeId,
            quizId: quizId || null
        });
        res.status(201).json(badge);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// @desc    Get user badges
// @route   GET /api/badges
router.get('/', protect, async (req, res) => {
    try {
        const badges = await Badge.find({ userId: req.user._id }).sort({ awardedAt: -1 });
        res.json(badges);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export default router;
//# sourceMappingURL=badgeRoutes.js.map