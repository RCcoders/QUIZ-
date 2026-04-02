import mongoose, { Schema, Document } from 'mongoose';
const NoteSchema = new Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    authorUid: { type: String, required: true }, // Index for fast retrieval of teacher's notes
    linkedQuizId: { type: String, default: null },
    published: { type: Boolean, default: false }, // Index for public library filtering
}, { timestamps: true });
// Performance Indexes
NoteSchema.index({ authorUid: 1 });
NoteSchema.index({ subject: 1 });
NoteSchema.index({ published: 1 });
NoteSchema.index({ createdAt: -1 });
export default mongoose.model('Note', NoteSchema);
//# sourceMappingURL=Note.js.map