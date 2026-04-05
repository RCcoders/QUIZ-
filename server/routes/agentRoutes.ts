import express from 'express';
import { z } from 'zod';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const multer = require('multer');
const pdfParse = require('pdf-parse');
import { protect, authorize } from '../middleware/authMiddleware.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import { validateBody } from '../middleware/validateBody.js';
import { generateTeacherQuiz } from '../ai/teacherAgent.js';
import { generateStudentNotes, ValidationError } from '../ai/studentAgent.js';
import { generateAdaptiveQuiz } from '../ai/adaptiveAgent.js';
import { buildCacheKey } from '../ai/cacheKey.js';
import { AiCache } from '../models/AiCache.js';
import { ok, fail } from '../utils/response.js';

const router = express.Router();

// ── Zod schemas for input validation ────────────────────────────────────────

const teacherQuizSchema = z.object({
  topic: z.string().min(1, 'topic is required').max(500),
  count: z.number().int().min(1).max(50).default(5),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questionType: z.enum(['mcq', 'subjective', 'poll']).default('mcq'),
  context: z.string().max(20000).optional(),
});

const studentNotesSchema = z.object({
  topic: z.string().min(1, 'topic is required').max(500),
  noteText: z.string().max(10000).optional(),
  content: z.string().max(10000).optional(),
});

const adaptiveQuizSchema = z.object({
  count: z.number().int().min(1).max(20).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  fallbackTopic: z.string().max(500).optional(),
});

// ── Unified AI controller ───────────────────────────────────────────────────
// POST /api/ai/agent/run
const runSchema = z.object({
  mode: z.enum(['TEACHER_AGENT', 'STUDENT_AGENT', 'ADAPTIVE_AGENT']),
  data: z.record(z.string(), z.unknown()),
});

router.post('/run', protect, aiRateLimiter, validateBody(runSchema), async (req: any, res: any) => {
  try {
    const { mode, data } = req.body;

    if (mode === 'TEACHER_AGENT') {
      const parseResult = teacherQuizSchema.safeParse(data);
      if (!parseResult.success) {
        return res.status(422).json(fail(parseResult.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')));
      }
      const params = parseResult.data as any;
      const cacheKey = buildCacheKey({ type: 'teacherQuiz', ...params });
      const cached = await AiCache.findOne({ cacheKey, agentType: 'teacher' });
      if (cached) {
        return res.json(ok({ questions: cached.response, fromCache: true }));
      }
      const result = await generateTeacherQuiz(params);
      try {
        await AiCache.create({ cacheKey, agentType: 'teacher', response: result, version: 1 });
      } catch (cacheErr) {
        // Silently skip duplicate key errors during cache write (race condition)
      }
      return res.json(ok({ questions: result }));
    }

    if (mode === 'STUDENT_AGENT') {
      const parseResult = studentNotesSchema.safeParse(data);
      if (!parseResult.success) {
        return res.status(422).json(fail(parseResult.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')));
      }
      const params = parseResult.data as any;
      const cacheKey = buildCacheKey({ type: 'studentNotes', ...params });
      const cached = await AiCache.findOne({ cacheKey, agentType: 'student' });
      if (cached) {
        return res.json(ok({ ...cached.response, fromCache: true }));
      }
      const result = await generateStudentNotes(params);
      try {
        await AiCache.create({ cacheKey, agentType: 'student', response: result, version: 1 });
      } catch (cacheErr) {
        // Silently skip
      }
      return res.json(ok(result));
    }

    if (mode === 'ADAPTIVE_AGENT') {
      const parseResult = adaptiveQuizSchema.safeParse(data);
      if (!parseResult.success) {
        return res.status(422).json(fail(parseResult.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')));
      }
      const params = parseResult.data as any;
      const userId = req.user._id;
      const cacheKey = buildCacheKey({ type: 'adaptiveQuiz', userId, ...params });
      const cached = await AiCache.findOne({ cacheKey, agentType: 'adaptive' });
      if (cached) {
        return res.json(ok({ questions: cached.response, fromCache: true }));
      }
      const result = await generateAdaptiveQuiz(userId, params);
      try {
        await AiCache.create({ cacheKey, agentType: 'adaptive', response: result, version: 1 });
      } catch (cacheErr) {
        // Silently skip
      }
      return res.json(ok({ questions: result }));
    }

    return res.status(400).json(fail('Invalid mode'));
  } catch (err: any) {
    if (err && err.name === 'ZodError') {
      const message = err.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(422).json(fail(message));
    }
    if (err && err.name === 'ValidationError') {
      return res.status(err.status || 400).json(fail(err.message));
    }
    console.error('[AI /run]', err.message || err);
    return res.status(err.status || 500).json(fail(err.message || 'AI service error'));
  }
});

// ── Legacy routes (kept for backward compatibility) ─────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  }
});

router.post('/teacher/quiz', protect, authorize('teacher'), aiRateLimiter, validateBody(teacherQuizSchema), async (req: any, res: any) => {
  try {
    const params = req.body;
    const cacheKey = buildCacheKey({ type: 'teacherQuiz', ...params });
    const cached = await AiCache.findOne({ cacheKey, agentType: 'teacher' });
    if (cached) {
      return res.json(ok({ questions: cached.response, fromCache: true }));
    }
    const result = await generateTeacherQuiz(params);
    try {
      await AiCache.create({ cacheKey, agentType: 'teacher', response: result, version: 1 });
    } catch (cacheErr) {
      // Silently skip
    }
    return res.json(ok({ questions: result }));
  } catch (err: any) {
    if (err && err.name === 'ZodError') {
      return res.status(422).json(fail(err.issues.map((e: any) => e.message).join(', ')));
    }
    return res.status(err.status || 500).json(fail(err.message || 'Server error'));
  }
});

router.post('/teacher/quiz-from-pdf', protect, authorize('teacher'), aiRateLimiter, (req: any, res: any, next: any) => {
  upload.single('pdf')(req, res, (err: any) => {
    if (err) {
      if (err.message === 'Only PDF files are accepted' || err.message === 'File too large') {
        return res.status(400).json(fail(err.message === 'File too large' ? 'File size exceeds 10 MB limit' : err.message));
      }
      return res.status(400).json(fail(err.message));
    }
    next();
  });
}, async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json(fail('PDF file is required'));
    }
    const parsedPdf = await pdfParse(req.file.buffer);
    const text = parsedPdf.text;
    if (!text || !text.trim()) {
      return res.status(422).json(fail('No extractable text found in PDF'));
    }
    const params = req.body;
    params.context = text.substring(0, 20000);
    params.questionType = params.questionType || 'mcq';
    const result = await generateTeacherQuiz(params);
    return res.json(ok({ questions: result }));
  } catch (err: any) {
    return res.status(err.status || 500).json(fail(err.message || 'Server error'));
  }
});

router.post('/student/notes', protect, authorize('student'), aiRateLimiter, validateBody(studentNotesSchema), async (req: any, res: any) => {
  try {
    const params = req.body;
    const cacheKey = buildCacheKey({ type: 'studentNotes', ...params });
    const cached = await AiCache.findOne({ cacheKey, agentType: 'student' });
    if (cached) {
      return res.json(ok({ ...cached.response, fromCache: true }));
    }
    const result = await generateStudentNotes(params);
    try {
      await AiCache.create({ cacheKey, agentType: 'student', response: result, version: 1 });
    } catch (cacheErr) {
      // Silently skip
    }
    return res.json(ok(result));
  } catch (err: any) {
    if (err instanceof ValidationError) {
      return res.status(err.status).json(fail(err.message));
    }
    return res.status(500).json(fail(err.message || 'Server error'));
  }
});

router.post('/adaptive/quiz', protect, authorize('student'), aiRateLimiter, validateBody(adaptiveQuizSchema), async (req: any, res: any) => {
  try {
    const params = req.body;
    const userId = req.user._id;
    const cacheKey = buildCacheKey({ type: 'adaptiveQuiz', userId, ...params });
    const cached = await AiCache.findOne({ cacheKey, agentType: 'adaptive' });
    if (cached) {
      return res.json(ok({ questions: cached.response, fromCache: true }));
    }
    const result = await generateAdaptiveQuiz(userId, params);
    try {
      await AiCache.create({ cacheKey, agentType: 'adaptive', response: result, version: 1 });
    } catch (cacheErr) {
      // Silently skip
    }
    return res.json(ok({ questions: result }));
  } catch (err: any) {
    return res.status(err.status || 500).json(fail(err.message || 'Server error'));
  }
});

export default router;
