import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    displayName: { type: String, required: true },
    role: { type: String, enum: ['teacher', 'student'], default: 'student' },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: String },
}, { timestamps: true });
UserSchema.pre('save', async function () {
    if (!this.isModified('password'))
        return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
export default mongoose.model('User', UserSchema);
//# sourceMappingURL=User.js.map