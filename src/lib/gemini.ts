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


    const prompt = `You are an expert educator and assessment designer with deep knowledge across multiple subjects. Your task is to create high-quality, pedagogically sound multiple-choice quiz questions.

EDUCATIONAL CONTENT:
${syllabusText}

TASK: Generate exactly ${numQuestions} multiple-choice questions (MCQs) based on the content above.

QUALITY REQUIREMENTS:

1. **Question Design**:
   - Focus on testing UNDERSTANDING and APPLICATION, not just memorization
   - Use clear, unambiguous language
   - Avoid trick questions or ambiguous phrasing
   - Vary question types: definitions, scenarios, applications, comparisons, cause-effect
   - Include the key information needed to answer in the question stem

2. **Answer Options**:
   - Create exactly 4 options (A, B, C, D) for each question
   - Make only ONE option clearly and definitively correct
   - Design PLAUSIBLE distractors (wrong options) that might seem correct to someone with incomplete understanding
   - Avoid "all of the above" or "none of the above" options
   - Keep all options roughly the same length
   - Avoid obvious patterns (e.g., "C" being correct too often)

3. **Difficulty Distribution**:
   - Easy (${Math.ceil(numQuestions * 0.4)} questions): Basic recall and comprehension
   - Medium (${Math.ceil(numQuestions * 0.4)} questions): Application and analysis
   - Hard (${Math.floor(numQuestions * 0.2)} questions): Synthesis and evaluation
   - Sort final output: easy questions first, then medium, then hard

4. **Content Coverage**:
   - Cover different concepts from the material
   - Don't repeat the same concept in multiple questions
   - Ensure questions span the breadth of the content provided

5. **Common Pitfalls to AVOID**:
   ❌ Negatively worded questions (e.g., "Which is NOT...")
   ❌ Questions with multiple correct answers
   ❌ Trivial questions about minor details
   ❌ Questions requiring external knowledge not in the content
   ❌ Absolute words like "always", "never" in options

EXAMPLE OF A HIGH-QUALITY QUESTION:
{
  "question_text": "A student notices that a plant placed near a window grows toward the light. Which biological process best explains this behavior?",
  "option_a": "Phototropism",
  "option_b": "Gravitropism",
  "option_c": "Thigmotropism",
  "option_d": "Hydrotropism",
  "correct_answer": "A",
  "difficulty": "medium"
}

OUTPUT FORMAT:
Respond with ONLY a valid JSON array. No explanations, no markdown formatting, just the raw JSON array:

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

Generate ${numQuestions} questions now:`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Handle specific error cases
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            }
            if (response.status === 400) {
                throw new Error('Invalid request. Please check your input content.');
            }
            if (response.status === 401 || response.status === 403) {
                throw new Error('Invalid API key. Please check your Gemini API key configuration.');
            }

            throw new Error(errorData.error?.message || `AI service error (${response.status}). Please try again.`);
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            throw new Error('No response from AI. Please try again.');
        }

        // Parse the JSON response
        let questions: GeneratedQuestion[];
        try {
            // Clean the response - remove markdown code blocks if present
            const cleanedText = textContent
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            questions = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('Failed to parse AI response:', textContent);
            throw new Error('AI generated invalid format. Please try again or rephrase your content.');
        }

        if (!Array.isArray(questions)) {
            throw new Error('AI response was not an array of questions. Please try again.');
        }

        // Validate and filter questions
        const validQuestions = questions.filter((q) =>
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

        if (validQuestions.length < numQuestions * 0.5) {
            console.warn(`Only ${validQuestions.length} of ${numQuestions} questions were valid`);
        }

        // Sort by difficulty
        const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
        return validQuestions.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
    } catch (error) {
        console.error('Error generating questions:', error);

        // Throw user-friendly errors
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to generate questions. Please check your internet connection and try again.');
    }
}
