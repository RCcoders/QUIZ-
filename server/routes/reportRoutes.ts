import express from 'express';
import GameSession from '../models/GameSession.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all reports (GameSessions) for a teacher
// @route   GET /api/reports
router.get('/', protect, authorize('teacher'), async (req: any, res) => {
    try {
        // Fetch all GameSession documents for this teacher, populate their Quiz to know questions length
        const sessions = await GameSession.find({ teacherId: req.user._id })
            .populate('quizId', 'title questions')
            .sort({ createdAt: -1 })
            .lean();

        const reports = sessions.map(session => {
            const quiz: any = session.quizId || {};
            const quizTitle = session.quizTitle || quiz.title || 'Untitled Quiz';
            const participantCount = session.participants?.length || 0;

            let averageScore = 0;
            if (participantCount > 0) {
                // Calculate total accumulated raw score across all participants
                const totalScore = session.participants.reduce((sum: number, p: any) => sum + (p.score || 0), 0);

                // Assuming standard 10 points per question if known, else assume standard max 100 percentage.
                const maxPossibleScorePerParticipant = quiz.questions?.length ? quiz.questions.length * 10 : 100;

                const avgRawScore = totalScore / participantCount;
                const percentage = maxPossibleScorePerParticipant > 0
                    ? (avgRawScore / maxPossibleScorePerParticipant) * 100
                    : 0;

                averageScore = Math.min(Math.round(percentage), 100);
            }

            return {
                id: session._id as string,
                quizTitle,
                date: (session as any).createdAt || new Date(),
                participantCount,
                averageScore,
                completed: session.status === 'ended' || !!session.endedAt
            };
        });

        res.json(reports);
    } catch (error: any) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
