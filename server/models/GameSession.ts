import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant {
    userId?: string;
    name: string;
    email?: string;
    score: number;
    lastAnswerTimeMs?: number;
    hasAnsweredCurrentQuestion?: boolean;
    violationCount?: number;
    joinedAt: Date;
}

export interface IGameSession extends Document {
    quizId: string;
    quizTitle?: string;
    teacherId: string;
    gameCode: string;
    status: 'waiting' | 'playing' | 'question' | 'results' | 'ended';
    currentQuestionIndex: number;
    participants: IParticipant[];
    currentQuestionAnswers: number[];
    questionStartedAt?: Date | null;
    endedAt?: Date | null;
}

const ParticipantSchema = new Schema({
    userId: { type: String },
    name: { type: String, required: true },
    email: { type: String },
    score: { type: Number, default: 0 },
    lastAnswerTimeMs: { type: Number, default: 0 },
    hasAnsweredCurrentQuestion: { type: Boolean, default: false },
    violationCount: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
});

const GameSessionSchema: Schema = new Schema({
    quizId: { type: String, required: true },
    quizTitle: { type: String },
    teacherId: { type: String, required: true },
    gameCode: { type: String, required: true, unique: true }, // Fast lookup by join code
    status: {
        type: String,
        enum: ['waiting', 'playing', 'question', 'results', 'ended'],
        default: 'waiting'
    },
    currentQuestionIndex: { type: Number, default: 0 },
    participants: [ParticipantSchema],
    currentQuestionAnswers: [Number], // Track times for average calculation
    questionStartedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
}, { timestamps: true });

// Performance Indexes
GameSessionSchema.index({ teacherId: 1 });
GameSessionSchema.index({ status: 1 });

export default mongoose.model<IGameSession>('GameSession', GameSessionSchema);
