import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import GameSession from '../models/GameSession.js';
import ScoreRecord from '../models/ScoreRecord.js';

interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        role: string;
        email?: string;
        displayName?: string;
    };
}

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const teacherId = req.user?._id;

        if (!teacherId || req.user?.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied. Teachers only.' });
        }

        const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

        // 1. Total Quizzes
        const totalQuizzes = await Quiz.countDocuments({ teacherId: teacherObjectId });

        // 2. Active Sessions
        // A session is active if status is not 'ended'
        const activeSessions = await GameSession.countDocuments({
            teacherId: teacherId.toString(),
            status: { $ne: 'ended' }
        });

        // Get all quiz IDs for this teacher to use in subsequent queries
        const quizzes = await Quiz.find({ teacherId: teacherObjectId }, '_id');
        const quizIds = quizzes.map(q => q._id.toString());

        // Default stats if no score records exist
        let totalStudents = 0;
        let averageScore = 0;
        let averageTimeTaken = 0;
        let weeklyData = [
            { day: 'Mon', pct: 0 },
            { day: 'Tue', pct: 0 },
            { day: 'Wed', pct: 0 },
            { day: 'Thu', pct: 0 },
            { day: 'Fri', pct: 0 },
            { day: 'Sat', pct: 0 },
            { day: 'Sun', pct: 0 }
        ];

        if (quizIds.length > 0) {
            // 3. Total Students (unique students who have taken these quizzes)
            const uniqueStudents = await ScoreRecord.distinct('userId', { quizId: { $in: quizIds } });
            totalStudents = uniqueStudents.length;

            // 4 & 5. Aggregate Average Score and Average Time
            const stats = await ScoreRecord.aggregate([
                { $match: { quizId: { $in: quizIds } } },
                {
                    $group: {
                        _id: null,
                        avgPercentage: { $avg: '$percentage' },
                        avgTime: { $avg: '$timeTakenMs' }
                    }
                }
            ]);

            if (stats.length > 0) {
                averageScore = stats[0].avgPercentage || 0;
                averageTimeTaken = stats[0].avgTime || 0;
            }

            // 6. Weekly Completion Rate
            // Get records from the last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const weeklyStats = await ScoreRecord.aggregate([
                {
                    $match: {
                        quizId: { $in: quizIds },
                        completedAt: { $gte: sevenDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: { $dayOfWeek: '$completedAt' }, // 1 (Sunday) to 7 (Saturday)
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Map MongoDB $dayOfWeek to our array (MongoDB: 1=Sun, 2=Mon...7=Sat)
            // Our array expects: Mon, Tue, Wed, Thu, Fri, Sat, Sun
            const dayMap: { [key: number]: number } = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 1: 6 };

            // Find max count to calculate percentage height for the bar chart
            let maxCount = 0;
            weeklyStats.forEach(stat => {
                if (stat.count > maxCount) maxCount = stat.count;
            });

            if (maxCount > 0) {
                weeklyStats.forEach(stat => {
                    const mongoDay = stat._id as number;
                    const arrayIndex = dayMap[mongoDay];
                    if (arrayIndex !== undefined && weeklyData[arrayIndex]) {
                        // Calculate percentage relative to the day with the most completions
                        const pctValue = Math.round((stat.count / maxCount) * 100);
                        const dataItem = weeklyData[arrayIndex];
                        if (dataItem) {
                            dataItem.pct = pctValue;
                        }
                    }
                });
            }
        }

        res.json({
            totalQuizzes,
            activeSessions,
            totalStudents,
            averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal place
            averageTimeTakenMs: Math.round(averageTimeTaken),
            weeklyData
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching dashboard statistics' });
    }
};
