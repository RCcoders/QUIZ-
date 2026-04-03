import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import User from '../models/User.js';
import ScoreRecord from '../models/ScoreRecord.js';
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
export const generateAdaptiveQuiz = async (userId, subject, topic, difficultyPreference, numQuestions = 10) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // 1. Fetch user performance for this subject
    const scores = await ScoreRecord.find({ userId, subject: subject })
        .sort({ completedAt: -1 })
        .limit(10)
        .lean();
    // 2. Determine dominant weak difficulty
    let dominantWeakDifficulty = difficultyPreference || 'medium';
    if (scores.length > 0) {
        const difficultyStats = { easy: 0, medium: 0, hard: 0 };
        const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
        scores.forEach((s) => {
            const diff = (s.percentage < 60 ? 'easy' : s.percentage < 85 ? 'medium' : 'hard');
            difficultyStats[diff] += s.percentage;
            difficultyCounts[diff]++;
        });
        const averages = Object.entries(difficultyStats).map(([diff, total]) => ({
            diff: diff,
            avg: difficultyCounts[diff] > 0
                ? total / difficultyCounts[diff]
                : 100
        }));
        if (averages.length > 0 && averages[0]) {
            averages.sort((a, b) => a.avg - b.avg);
            const weakest = averages[0];
            if (weakest) {
                dominantWeakDifficulty = weakest.diff;
            }
        }
    }
    const clampedNum = Math.min(20, Math.max(5, numQuestions));
    // Weight question counts toward dominantWeakDifficulty
    const dominantCount = Math.round(clampedNum * 0.6);
    const otherCount = clampedNum - dominantCount;
    const otherTiers = ['easy', 'medium', 'hard'].filter((t) => t !== dominantWeakDifficulty);
    const otherCountEach = Math.floor(otherCount / 2);
    const remainder = otherCount - otherCountEach * 2;
    const difficultyBreakdown = {
        [dominantWeakDifficulty]: dominantCount,
        [otherTiers[0]]: otherCountEach + remainder,
        [otherTiers[1]]: otherCountEach,
    };
    const topicContext = topic ? `Specifically focus on the topic: ${topic}.` : '';
    const prompt = `You are an expert educator creating an adaptive quiz for a student studying ${subject}.
${topicContext}

The student's weakest difficulty tier is "${dominantWeakDifficulty}", so questions should be weighted toward that level.

DIFFICULTY DISTRIBUTION (generate exactly these counts):
- easy: ${difficultyBreakdown['easy'] ?? 0} questions
- medium: ${difficultyBreakdown['medium'] ?? 0} questions
- hard: ${difficultyBreakdown['hard'] ?? 0} questions

TASK: Generate exactly ${clampedNum} multiple-choice questions.

REQUIREMENTS:
1. Each question must have exactly 4 options (A, B, C, D) with only one correct answer.
2. Questions should test understanding and application, not just memorization.
3. Distractors (wrong options) should be plausible.
4. Avoid negatively worded questions.
5. Sort output: easy questions first, then medium, then hard.

OUTPUT FORMAT:
Respond with ONLY a valid JSON array. No explanations, no markdown, just raw JSON:

[
  {
    "question_text": "Your question here?",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "A",
    "difficulty": "easy"
  }
]`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        const questions = JSON.parse(cleanedText);
        if (!Array.isArray(questions))
            throw new Error('Invalid AI response format');
        const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
        return questions.sort((a, b) => (difficultyOrder[a.difficulty] ?? 0) - (difficultyOrder[b.difficulty] ?? 0));
    }
    catch (error) {
        console.error('Adaptive generation error:', error);
        throw new Error('Failed to generate adaptive questions');
    }
};
export const generateQuestionsFromText = async (syllabusText, numQuestions = 10) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are an expert educator. Generate exactly ${numQuestions} multiple-choice questions based on this content:
    
    ${syllabusText}
    
    Each question must have exactly 4 options (A, B, C, D) with one correct answer.
    Return JSON array of objects with: question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty.`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        const questions = JSON.parse(cleanedText);
        return Array.isArray(questions) ? questions : [];
    }
    catch (error) {
        console.error('Question generation error:', error);
        throw new Error('Failed to generate questions');
    }
};
//# sourceMappingURL=adaptiveService.js.map