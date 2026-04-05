import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import NodeCache from 'node-cache';

const router = express.Router();
// Track request volume in a 5-second window for jitter protection
const requestHistory = new NodeCache({ stdTTL: 5, checkperiod: 1 });

// ── Retry helper: 3 attempts with exponential backoff (100, 200, 400 ms) ──
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    let delay = 100;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err: any) {
            const isLast = i === attempts - 1;
            // Duplicate key errors should not be retried
            if (err.code === 11000 || isLast) throw err;
            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
        }
    }
    throw new Error('Unreachable');
}

// ── Register User ──
router.post('/register', authRateLimiter, async (req, res) => {
    try {
        const { email, password, displayName, role } = req.body;

        // Atomic upsert to avoid duplicate-write race conditions under load
        const existingUser = await User.findOne({ email }).select('_id email displayName role');

        if (existingUser) {
            // Allow student → teacher role upgrade
            if (existingUser.role === 'student' && role === 'teacher') {
                const updated = await withRetry(() =>
                    User.findOneAndUpdate(
                        { email },
                        { role: 'teacher', ...(displayName && { displayName }), ...(password && { password }) },
                        { returnDocument: 'after', runValidators: true }
                    )
                );
                if (!updated) return res.status(500).json({ message: 'Failed to update account' });
                return res.status(200).json({
                    _id: updated._id,
                    email: updated.email,
                    displayName: updated.displayName,
                    role: updated.role,
                    token: generateToken(updated._id.toString(), updated.role),
                });
            }
            return res.status(409).json({
                message: `Account already exists as a ${existingUser.role}. Please log in instead.`,
            });
        }

        const user = await withRetry(() =>
            User.create({ email, password, displayName, role })
        );

        return res.status(201).json({
            _id: user._id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            token: generateToken(user._id.toString(), user.role),
        });
    } catch (error: any) {
        // Mongo duplicate key (race condition on simultaneous register)
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Account already exists. Please log in instead.' });
        }
        console.error('[auth/register]', error.message);
        return res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
});

// ── Login User ──
router.post('/login', authRateLimiter, async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // ── Thundering Herd / Queue Overflow Protection ──
        // If > 200 requests in 5 seconds, add jitter to stagger DB hits
        const count = (requestHistory.get<number>('login_count') || 0) + 1;
        requestHistory.set('login_count', count);
        if (count > 200) {
            const jitter = Math.random() * 2000;
            await new Promise(r => setTimeout(r, jitter));
        }

        const user = await User.findOne({ email }).select('_id email displayName role password');

        if (user && (await (user as any).matchPassword(password))) {
            if (role && user.role !== role) {
                return res.status(401).json({
                    message: `Access denied. This account is registered as a ${user.role}.`,
                });
            }
            return res.json({
                _id: user._id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                token: generateToken(user._id.toString(), user.role),
            });
        }
        return res.status(401).json({ message: 'Invalid email or password' });
    } catch (error: any) {
        console.error('[auth/login]', error.message);
        return res.status(500).json({ message: 'Server error. Try again in a moment.' });
    }
});

const generateToken = (id: string, role: string) => {
    // HS256 expiry: 2h for students, 8h for teachers
    const expiry = role === 'teacher' ? '8h' : '2h';
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: expiry,
    });
};

export default router;
