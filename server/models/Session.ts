import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant {
    userId?: mongoose.Types.ObjectId;
    name: string;
    email?: string;
    score: number;
    joinedAt: Date;
}

export interface IGameSession extends Document {
    quizId: mongoose.Types.ObjectId;
    teacherId: mongoose.Types.ObjectId;
    gameCode: string; // unique 6-char code
    status: 'waiting' | 'playing' | 'ended';
    currentQuestionIndex: number;
    participants: IParticipant[];
}

const ParticipantSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String },
    score: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
});

const GameSessionSchema: Schema = new Schema({
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gameCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ['waiting', 'playing', 'question', 'results', 'ended'], default: 'waiting' },

    currentQuestionIndex: { type: Number, default: 0 },
    participants: [ParticipantSchema],
}, { timestamps: true });

export default mongoose.model<IGameSession>('GameSession', GameSessionSchema);
