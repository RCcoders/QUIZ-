import mongoose, { Schema, Document } from 'mongoose';
const ScoreRecordSchema = new Schema({
    userId: { type: String, required: true }, // Index for student stats
    quizId: { type: String, required: true },
    quizTitle: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now },
    subject: { type: String }, // Index for subject-wise performance analysis
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    timeTakenMs: { type: Number },
}, { timestamps: true });
// Performance Indexes
ScoreRecordSchema.index({ userId: 1 });
ScoreRecordSchema.index({ subject: 1 });
ScoreRecordSchema.index({ completedAt: -1 });
export default mongoose.model('ScoreRecord', ScoreRecordSchema);
//# sourceMappingURL=ScoreRecord.js.map