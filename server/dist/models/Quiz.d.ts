import mongoose, { Document } from 'mongoose';
export interface IQuestion {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    difficulty: 'easy' | 'medium' | 'hard';
}
export interface IQuiz extends Document {
    teacherId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    subject?: string;
    timerEnabled: boolean;
    timerSeconds: number;
    questions: IQuestion[];
    isActive: boolean;
}
declare const _default: mongoose.Model<IQuiz, {}, {}, {}, mongoose.Document<unknown, {}, IQuiz, {}, mongoose.DefaultSchemaOptions> & IQuiz & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IQuiz>;
export default _default;
//# sourceMappingURL=Quiz.d.ts.map