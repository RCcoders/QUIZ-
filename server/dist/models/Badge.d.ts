import mongoose from 'mongoose';
declare const Badge: mongoose.Model<{
    userId: mongoose.Types.ObjectId;
    badgeId: "first_quiz" | "streak_3" | "streak_7" | "perfect_score" | "high_achiever" | "improvement";
    awardedAt: NativeDate;
    quizId?: mongoose.Types.ObjectId | null;
}, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    userId: mongoose.Types.ObjectId;
    badgeId: "first_quiz" | "streak_3" | "streak_7" | "perfect_score" | "high_achiever" | "improvement";
    awardedAt: NativeDate;
    quizId?: mongoose.Types.ObjectId | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    userId: mongoose.Types.ObjectId;
    badgeId: "first_quiz" | "streak_3" | "streak_7" | "perfect_score" | "high_achiever" | "improvement";
    awardedAt: NativeDate;
    quizId?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    userId: mongoose.Types.ObjectId;
    badgeId: "first_quiz" | "streak_3" | "streak_7" | "perfect_score" | "high_achiever" | "improvement";
    awardedAt: NativeDate;
    quizId?: mongoose.Types.ObjectId | null;
}, mongoose.Document<unknown, {}, {
    userId: mongoose.Types.ObjectId;
    badgeId: "first_quiz" | "streak_3" | "streak_7" | "perfect_score" | "high_achiever" | "improvement";
    awardedAt: NativeDate;
    quizId?: mongoose.Types.ObjectId | null;
}, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<{
    userId: mongoose.Types.ObjectId;
    badgeId: "first_quiz" | "streak_3" | "streak_7" | "perfect_score" | "high_achiever" | "improvement";
    awardedAt: NativeDate;
    quizId?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    userId: mongoose.Types.ObjectId;
    badgeId: "first_quiz" | "streak_3" | "streak_7" | "perfect_score" | "high_achiever" | "improvement";
    awardedAt: NativeDate;
    quizId?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    userId: mongoose.Types.ObjectId;
    badgeId: "first_quiz" | "streak_3" | "streak_7" | "perfect_score" | "high_achiever" | "improvement";
    awardedAt: NativeDate;
    quizId?: mongoose.Types.ObjectId | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export default Badge;
//# sourceMappingURL=Badge.d.ts.map