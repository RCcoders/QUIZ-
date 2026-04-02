import mongoose, { Schema, Document } from 'mongoose';
const QuestionSchema = new Schema({
    questionText: { type: String, required: true },
    optionA: { type: String, required: true },
    optionB: { type: String, required: true },
    optionC: { type: String, required: true },
    optionD: { type: String, required: true },
    correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
});
const QuizSchema = new Schema({
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String },
    timerEnabled: { type: Boolean, default: true },
    timerSeconds: { type: Number, default: 30 },
    questions: [QuestionSchema],
    isActive: { type: Boolean, default: false },
}, { timestamps: true });
export default mongoose.model('Quiz', QuizSchema);
//# sourceMappingURL=Quiz.js.map