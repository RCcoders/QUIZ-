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
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ email, password, displayName, role });

        if (user) {
            res.status(201).json({
                _id: user._id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                token: generateToken(user._id as string),
            });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await (user as any).matchPassword(password))) {
            res.json({
                _id: user._id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                token: generateToken(user._id as string),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

export default router;
