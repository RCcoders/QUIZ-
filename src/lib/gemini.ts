const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
    }

    const prompt = `You are an expert educator creating quiz questions. Based on the following educational content, generate exactly ${numQuestions} multiple-choice questions.

EDUCATIONAL CONTENT:
${syllabusText}

REQUIREMENTS:
1. Create exactly ${numQuestions} questions
2. Each question must have exactly 4 options (A, B, C, D)
3. Only ONE option should be correct
4. Sort questions by difficulty: easy first, then medium, then hard
5. Make questions clear and unambiguous
6. Options should be plausible but only one clearly correct
7. Cover different aspects of the content

RESPOND WITH ONLY a valid JSON array in this exact format:
[
  {
    "question_text": "What is...?",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "A",
    "difficulty": "easy"
  }
]

Generate the questions now:`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to generate questions');
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            throw new Error('No content received from AI');
        }

        // Extract JSON from the response (handle markdown code blocks)
        let jsonStr = textContent;
        const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        // Try to find JSON array in the text
        const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            jsonStr = arrayMatch[0];
        }

        const questions: GeneratedQuestion[] = JSON.parse(jsonStr);

        // Validate and sort by difficulty
        const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
        return questions
            .filter((q) =>
                q.question_text &&
                q.option_a &&
                q.option_b &&
                q.option_c &&
                q.option_d &&
                ['A', 'B', 'C', 'D'].includes(q.correct_answer) &&
                ['easy', 'medium', 'hard'].includes(q.difficulty)
            )
            .sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
    } catch (error) {
        console.error('Error generating questions:', error);
        throw error;
    }
}
