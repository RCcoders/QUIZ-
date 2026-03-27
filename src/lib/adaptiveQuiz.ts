import { ScoreRecord } from '../types/student';
import { GeneratedQuestion } from './gemini';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface PerformanceProfile {
  subject: string;
  recentScores: Array<{ percentage: number; difficulty: 'easy' | 'medium' | 'hard' }>;
  weakTopics: string[];
  dominantWeakDifficulty: 'easy' | 'medium' | 'hard';
}

// Extended ScoreRecord fields that may be present at runtime
interface ScoreRecordExtended extends ScoreRecord {
  difficulty?: 'easy' | 'medium' | 'hard';
  questions?: Array<{
    question_text: string;
    correct: boolean;
  }>;
}

export function buildPerformanceProfile(
  scores: ScoreRecord[],
  subject: string
): PerformanceProfile {
  const subjectScores = scores.filter(
    (s) => s.subject?.toLowerCase() === subject.toLowerCase()
  ) as ScoreRecordExtended[];

  if (subjectScores.length === 0) {
    return {
      subject,
      recentScores: [],
      weakTopics: [],
      dominantWeakDifficulty: 'medium',
    };
  }

  // Compute average percentage per difficulty tier
  const tiers: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
  const avgByDifficulty: Record<'easy' | 'medium' | 'hard', number | null> = {
    easy: null,
    medium: null,
    hard: null,
  };

  for (const tier of tiers) {
    const tierScores = subjectScores.filter((s) => s.difficulty === tier);
    if (tierScores.length > 0) {
      const sum = tierScores.reduce((acc, s) => acc + s.percentage, 0);
      avgByDifficulty[tier] = sum / tierScores.length;
    }
  }

  // Find the tier with the lowest average (only among tiers that have data)
  let dominantWeakDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  let lowestAvg = Infinity;

  for (const tier of tiers) {
    const avg = avgByDifficulty[tier];
    if (avg !== null && avg < lowestAvg) {
      lowestAvg = avg;
      dominantWeakDifficulty = tier;
    }
  }

  // Build recentScores array
  const recentScores = subjectScores
    .filter((s) => s.difficulty !== undefined)
    .map((s) => ({
      percentage: s.percentage,
      difficulty: s.difficulty as 'easy' | 'medium' | 'hard',
    }));

  // Derive weakTopics from question text of incorrect answers
  const weakTopics: string[] = [];
  for (const score of subjectScores) {
    if (score.questions) {
      for (const q of score.questions) {
        if (!q.correct && q.question_text?.trim()) {
          weakTopics.push(q.question_text.trim());
        }
      }
    }
  }

  return {
    subject,
    recentScores,
    weakTopics,
    dominantWeakDifficulty,
  };
}

export async function generateAdaptiveQuestions(
  profile: PerformanceProfile,
  noteContent: string,
  numQuestions: number
): Promise<GeneratedQuestion[]> {
  // Clamp numQuestions to 5–20
  const clampedNum = Math.min(20, Math.max(5, numQuestions));

  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
  }

  const { dominantWeakDifficulty, weakTopics, subject } = profile;

  // Weight question counts toward dominantWeakDifficulty
  // Dominant tier gets ~60%, the other two split the remaining 40%
  const dominantCount = Math.round(clampedNum * 0.6);
  const otherCount = clampedNum - dominantCount;
  const otherTiers = (['easy', 'medium', 'hard'] as const).filter(
    (t) => t !== dominantWeakDifficulty
  );
  const otherCountEach = Math.floor(otherCount / 2);
  const remainder = otherCount - otherCountEach * 2;

  const difficultyBreakdown = {
    [dominantWeakDifficulty]: dominantCount,
    [otherTiers[0]]: otherCountEach + remainder,
    [otherTiers[1]]: otherCountEach,
  };

  const weakTopicsSection =
    weakTopics.length > 0
      ? `\nFocus especially on these topics where the student has struggled:\n${weakTopics.slice(0, 10).map((t) => `- ${t}`).join('\n')}`
      : '';

  const prompt = `You are an expert educator creating an adaptive quiz for a student studying ${subject}.

The student's weakest difficulty tier is "${dominantWeakDifficulty}", so questions should be weighted toward that level.

DIFFICULTY DISTRIBUTION (generate exactly these counts):
- easy: ${difficultyBreakdown['easy']} questions
- medium: ${difficultyBreakdown['medium']} questions
- hard: ${difficultyBreakdown['hard']} questions
${weakTopicsSection}

LEARNING CONTENT:
${noteContent}

TASK: Generate exactly ${clampedNum} multiple-choice questions based on the content above.

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
]

Generate ${clampedNum} questions now:`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (response.status === 400) {
        throw new Error('Invalid request. Please check your input content.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API key. Please check your Gemini API key configuration.');
      }

      throw new Error(
        (errorData as { error?: { message?: string } }).error?.message ||
          `AI service error (${response.status}). Please try again.`
      );
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('No response from AI. Please try again.');
    }

    let questions: GeneratedQuestion[];
    try {
      const cleanedText = textContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      questions = JSON.parse(cleanedText);
    } catch {
      console.error('Failed to parse AI response:', textContent);
      throw new Error('AI generated invalid format. Please try again.');
    }

    if (!Array.isArray(questions)) {
      throw new Error('AI response was not an array of questions. Please try again.');
    }

    const validQuestions = questions.filter(
      (q) =>
        q.question_text?.trim() &&
        q.option_a?.trim() &&
        q.option_b?.trim() &&
        q.option_c?.trim() &&
        q.option_d?.trim() &&
        ['A', 'B', 'C', 'D'].includes(q.correct_answer) &&
        ['easy', 'medium', 'hard'].includes(q.difficulty)
    );

    if (validQuestions.length === 0) {
      throw new Error('AI failed to generate valid questions. Please try different content.');
    }

    // Sort by difficulty
    const difficultyOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
    return validQuestions.sort(
      (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
    );
  } catch (error) {
    console.error('Error generating adaptive questions:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate questions. Please check your internet connection and try again.');
  }
}
