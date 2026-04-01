// api/generate-questions.ts
// Vercel Serverless Function — runs server-side, keeps Gemini API key secret.
// The React app calls POST /api/generate-questions instead of Gemini directly.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // NOT VITE_ prefix — server only
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Rate limiting — simple in-memory store (resets on cold starts)
// For production scale, use Vercel KV or Upstash Redis
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;         // max 5 generations
const RATE_WINDOW_MS = 60 * 60 * 1000; // per hour per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — only allow requests from your own domain
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://quiz-t4pt.vercel.app',
    'http://localhost:5173',
    'http://localhost:4173',
  ];

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Rate limiting by IP
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.socket.remoteAddress
    || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'Rate limit exceeded. You can generate up to 5 quizzes per hour. Please wait before trying again.',
    });
  }

  // Validate request body
  const { syllabusText, numQuestions = 10 } = req.body;

  if (!syllabusText || typeof syllabusText !== 'string') {
    return res.status(400).json({ error: 'syllabusText is required' });
  }

  if (syllabusText.trim().length < 50) {
    return res.status(400).json({ error: 'Please provide at least 50 characters of content to generate questions from.' });
  }

  if (syllabusText.length > 20000) {
    return res.status(400).json({ error: 'Content is too long. Please limit to 20,000 characters.' });
  }

  const num = Math.min(Math.max(Number(numQuestions) || 10, 1), 20); // clamp 1-20

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'AI service is not configured. Please contact support.' });
  }

  const prompt = `You are an expert educator and assessment designer. Generate exactly ${num} multiple-choice questions based on the following content.

CONTENT:
${syllabusText}

REQUIREMENTS:
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE option is correct
- Vary difficulty: ${Math.ceil(num * 0.4)} easy, ${Math.ceil(num * 0.4)} medium, ${Math.floor(num * 0.2)} hard
- Focus on understanding and application, not memorization
- Sort output: easy first, then medium, then hard

Respond with ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "question_text": "Question here?",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "A",
    "difficulty": "easy"
  }
]`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return res.status(429).json({ error: 'AI service is busy. Please try again in a moment.' });
      if (status === 401 || status === 403) return res.status(500).json({ error: 'AI service configuration error.' });
      return res.status(500).json({ error: `AI service error (${status}). Please try again.` });
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return res.status(500).json({ error: 'No response from AI. Please try again.' });
    }

    const cleaned = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(cleaned);

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ error: 'AI returned invalid format. Please try again.' });
    }

    // Validate and filter
    const valid = questions.filter((q: Record<string, string>) =>
      q.question_text?.trim() &&
      q.option_a?.trim() &&
      q.option_b?.trim() &&
      q.option_c?.trim() &&
      q.option_d?.trim() &&
      ['A', 'B', 'C', 'D'].includes(q.correct_answer) &&
      ['easy', 'medium', 'hard'].includes(q.difficulty)
    );

    if (valid.length === 0) {
      return res.status(500).json({ error: 'AI failed to generate valid questions. Please try different content.' });
    }

    return res.status(200).json({ questions: valid });

  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: 'Failed to generate questions. Please check your internet connection.' });
  }
}
