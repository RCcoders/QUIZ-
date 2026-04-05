import mongoose, { Schema, Document } from 'mongoose';

export interface IScoreRecord extends Document {
    userId: string;
    quizId: string;
    quizTitle: string;
    score: number;
    total: number;
    percentage: number;
    completedAt: Date;
    subject?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    timeTakenMs?: number;
    violationCount: number;
    disqualified: boolean;
}

const ScoreRecordSchema: Schema = new Schema({
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
    violationCount: { type: Number, default: 0 },
    disqualified: { type: Boolean, default: false },
}, { timestamps: true });

// Performance Indexes
ScoreRecordSchema.index({ userId: 1 });
ScoreRecordSchema.index({ quizId: 1 });
ScoreRecordSchema.index({ subject: 1 });
ScoreRecordSchema.index({ completedAt: -1 });

export default mongoose.model<IScoreRecord>('ScoreRecord', ScoreRecordSchema);
