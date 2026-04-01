// src/lib/gemini.ts
// Calls the /api/generate-questions serverless function instead of Gemini directly.
// The actual API key is held server-side in the Vercel function.

export interface GeneratedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty: 'easy' | 'medium' | 'hard';
}

export async function generateQuestionsFromText(
  syllabusText: string,
  numQuestions: number = 10
): Promise<GeneratedQuestion[]> {
  const response = await fetch('/api/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ syllabusText, numQuestions }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status}). Please try again.`);
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('No valid questions were generated. Please try different content.');
  }

  // Sort by difficulty
  const difficultyOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
  return data.questions.sort(
    (a: GeneratedQuestion, b: GeneratedQuestion) =>
      difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
  );
}
