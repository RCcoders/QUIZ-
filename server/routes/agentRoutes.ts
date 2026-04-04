import express from 'express';
import multer from 'multer';
// @ts-ignore
import pdfParse from 'pdf-parse';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import { generateTeacherQuiz } from '../ai/teacherAgent.js';
import { generateStudentNotes, ValidationError } from '../ai/studentAgent.js';
import { generateAdaptiveQuiz } from '../ai/adaptiveAgent.js';
import { buildCacheKey } from '../ai/cacheKey.js';
import { AiCache } from '../models/AiCache.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  }
});

router.post('/teacher/quiz', protect, authorize('teacher'), aiRateLimiter, async (req: any, res: any) => {
  try {
    const params = req.body;
    params.questionType = params.questionType || 'mcq';
    
    if (!params.topic) {
      return res.status(400).json({ message: 'topic is required' });
    }

    const cacheKey = buildCacheKey({ type: 'teacherQuiz', ...params });
    const cached = await AiCache.findOne({ cacheKey, agentType: 'teacher' });
    if (cached) {
      return res.json(cached.response);
    }

    const result = await generateTeacherQuiz(params);
    await AiCache.create({ cacheKey, agentType: 'teacher', response: result });
    
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
});

router.post('/teacher/quiz-from-pdf', protect, authorize('teacher'), aiRateLimiter, (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err) {
      if (err.message === 'Only PDF files are accepted' || err.message === 'File too large') {
         return res.status(400).json({ message: err.message === 'File too large' ? 'File size exceeds 10 MB limit' : err.message });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    const parsedPdf = await pdfParse(req.file.buffer);
    const text = parsedPdf.text;
    if (!text || !text.trim()) {
      return res.status(422).json({ message: 'No extractable text found in PDF' });
    }

    const params = req.body;
    params.context = text.substring(0, 20000); // safety cap
    params.questionType = params.questionType || 'mcq';
    const result = await generateTeacherQuiz(params);
    
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
});

router.post('/student/notes', protect, authorize('student'), aiRateLimiter, async (req: any, res: any) => {
  try {
    const params = req.body;
    
    const cacheKey = buildCacheKey({ type: 'studentNotes', ...params });
    const cached = await AiCache.findOne({ cacheKey, agentType: 'student' });
    if (cached) {
      return res.json(cached.response);
    }

    const result = await generateStudentNotes(params);
    await AiCache.create({ cacheKey, agentType: 'student', response: result });
    
    res.json(result);
  } catch (err: any) {
    if (err instanceof ValidationError) {
      return res.status(err.status).json({ message: err.message });
    }
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

router.post('/adaptive/quiz', protect, authorize('student'), aiRateLimiter, async (req: any, res: any) => {
  try {
    const params = req.body;
    const userId = req.user._id;
    
    // No caching for adaptive
    const result = await generateAdaptiveQuiz(userId, params);
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
});

export default router;
