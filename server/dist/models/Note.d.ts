import mongoose, { Document } from 'mongoose';
export interface INote extends Document {
    title: string;
    subject: string;
    content: string;
    authorUid: string;
    linkedQuizId?: string | null;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<INote, {}, {}, {}, mongoose.Document<unknown, {}, INote, {}, mongoose.DefaultSchemaOptions> & INote & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, INote>;
export default _default;
//# sourceMappingURL=Note.d.ts.map