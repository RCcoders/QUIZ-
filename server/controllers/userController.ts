import User from '../models/User.js';
import type { Request, Response } from 'express';

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
export const getUserProfile = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                teacherId: user.teacherId,
                department: user.department,
                subjects: user.subjects,
                idCardImage: user.idCardImage,
                post: user.post,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
export const updateUserProfile = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.displayName = req.body.displayName || user.displayName;
            user.teacherId = req.body.teacherId || user.teacherId;
            user.department = req.body.department || user.department;
            user.subjects = req.body.subjects || user.subjects;
            user.idCardImage = req.body.idCardImage || user.idCardImage;
            user.post = req.body.post || user.post;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                email: updatedUser.email,
                displayName: updatedUser.displayName,
                role: updatedUser.role,
                teacherId: updatedUser.teacherId,
                department: updatedUser.department,
                subjects: updatedUser.subjects,
                idCardImage: updatedUser.idCardImage,
                post: updatedUser.post,
                token: req.headers.authorization.split(' ')[1], // Return the same token or a new one if needed
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
