import express from 'express';
import Note from '../models/Note.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all notes (with pagination)
// @route   GET /api/notes
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 12;
        const skip = (page - 1) * limit;

        const { subject, authorUid, published } = req.query;
        const query: any = {};
        if (subject) query.subject = subject;
        if (authorUid) query.authorUid = authorUid;
        if (published) query.published = published === 'true';

        // Use .lean() for faster queries
        const notes = await Note.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Note.countDocuments(query);

        res.json({
            notes,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single note
// @route   GET /api/notes/:id
router.get('/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id).lean();
        if (note) {
            res.json(note);
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a note
// @route   POST /api/notes
router.post('/', protect, authorize('teacher'), async (req: any, res) => {
    try {
        const { title, subject, content, linkedQuizId, published } = req.body;
        const note = await Note.create({
            title,
            subject,
            content,
            authorUid: req.user._id, // Set from auth middleware
            linkedQuizId,
            published
        });
        res.status(201).json(note);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update a note
// @route   PUT /api/notes/:id
router.put('/:id', protect, authorize('teacher'), async (req: any, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (note) {
            // Ensure only the author can update
            if (note.authorUid !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to update this note' });
            }

            note.title = req.body.title || note.title;
            note.subject = req.body.subject || note.subject;
            note.content = req.body.content || note.content;
            note.published = req.body.published !== undefined ? req.body.published : note.published;
            note.linkedQuizId = req.body.linkedQuizId || note.linkedQuizId;

            const updatedNote = await note.save();
            res.json(updatedNote);
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Partial update a note
// @route   PATCH /api/notes/:id
router.patch('/:id', protect, authorize('teacher'), async (req: any, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (note) {
            // Ensure only the author can update
            if (note.authorUid !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to update this note' });
            }

            // Apply partial updates
            if (req.body.title !== undefined) note.title = req.body.title;
            if (req.body.subject !== undefined) note.subject = req.body.subject;
            if (req.body.content !== undefined) note.content = req.body.content;
            if (req.body.published !== undefined) note.published = req.body.published;
            if (req.body.linkedQuizId !== undefined) note.linkedQuizId = req.body.linkedQuizId;

            const updatedNote = await note.save();
            res.json(updatedNote);
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete a note
// @route   DELETE /api/notes/:id
router.delete('/:id', protect, authorize('teacher'), async (req: any, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (note) {
            // Ensure only the author can delete
            if (note.authorUid !== req.user._id) {
                return res.status(403).json({ message: 'Not authorized to delete this note' });
            }

            await note.deleteOne();
            res.json({ message: 'Note removed' });
        } else {
            res.status(404).json({ message: 'Note not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
