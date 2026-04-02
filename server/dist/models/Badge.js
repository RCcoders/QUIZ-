import mongoose from 'mongoose';
const badgeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    badgeId: {
        type: String,
        required: true,
        enum: ['first_quiz', 'streak_3', 'streak_7', 'perfect_score', 'high_achiever', 'improvement']
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        default: null
    },
    awardedAt: {
        type: Date,
        default: Date.now
    }
});
const Badge = mongoose.model('Badge', badgeSchema);
export default Badge;
//# sourceMappingURL=Badge.js.map