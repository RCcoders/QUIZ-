import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const router = express.Router();
// Register User
router.post('/register', async (req, res) => {
    try {
        const { email, password, displayName, role } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            // If they are a student and want to be a teacher, let them "re-register" to update role
            if (userExists.role === 'student' && role === 'teacher') {
                userExists.role = 'teacher';
                if (displayName)
                    userExists.displayName = displayName;
                if (password)
                    userExists.password = password; // Will be hashed by pre-save
                await userExists.save();
                return res.status(200).json({
                    _id: userExists._id,
                    email: userExists.email,
                    displayName: userExists.displayName,
                    role: userExists.role,
                    token: generateToken(userExists._id.toString(), userExists.role),
                });
            }
            return res.status(400).json({ message: 'User already exists as a ' + userExists.role });
        }
        const user = await User.create({ email, password, displayName, role });
        if (user) {
            res.status(201).json({
                _id: user._id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                token: generateToken(user._id.toString(), user.role),
            });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            // Check role if provided
            if (role && user.role !== role) {
                return res.status(401).json({ message: `Access denied. Account is registered as a ${user.role}.` });
            }
            res.json({
                _id: user._id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                token: generateToken(user._id.toString(), user.role),
            });
        }
        else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};
export default router;
//# sourceMappingURL=authRoutes.js.map