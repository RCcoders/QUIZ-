import mongoose, { Document } from 'mongoose';
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
}
declare const _default: mongoose.Model<IScoreRecord, {}, {}, {}, mongoose.Document<unknown, {}, IScoreRecord, {}, mongoose.DefaultSchemaOptions> & IScoreRecord & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IScoreRecord>;
export default _default;
//# sourceMappingURL=ScoreRecord.d.ts.map