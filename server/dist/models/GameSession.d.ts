import mongoose, { Document } from 'mongoose';
export interface IParticipant {
    userId?: string;
    name: string;
    email?: string;
    score: number;
    lastAnswerTimeMs?: number;
    hasAnsweredCurrentQuestion?: boolean;
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
declare const _default: mongoose.Model<IGameSession, {}, {}, {}, mongoose.Document<unknown, {}, IGameSession, {}, mongoose.DefaultSchemaOptions> & IGameSession & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IGameSession>;
export default _default;
//# sourceMappingURL=GameSession.d.ts.map