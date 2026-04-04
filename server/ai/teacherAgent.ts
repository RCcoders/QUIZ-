import { openai, AI_MODEL } from './openaiClient.js';
import { buildTeacherQuizPrompt, TeacherQuizParams } from './promptTemplates.js';

export interface MCQQuestion {
  questionText: string;
  options: [string, string, string, string];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface SubjectiveQuestion {
  questionText: string;
  modelAnswer: string;
  rubric: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface PollQuestion {
  questionText: string;
  options: string[]; // 2-6 options
  topic: string;
}

export type TeacherQuestion = MCQQuestion | SubjectiveQuestion | PollQuestion;

export async function generateTeacherQuiz(params: TeacherQuizParams): Promise<TeacherQuestion[]> {
  const prompt = buildTeacherQuizPrompt(params);

  let raw = '';
  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    raw = response.choices[0]?.message?.content || '';
    
    // Attempt to parse JSON
    // If output is fenced, we try to parse it anyway by stripping fences 
    // (though prompt says return raw JSON, better to be safe)
    let jsonString = raw.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      throw new Error('Expected array');
    }
    
    return parsed as TeacherQuestion[];
  } catch (err: any) {
    if (err.name === 'SyntaxError' || err.message === 'Expected array') {
      console.error(raw);
      throw { message: 'AI response parse error', raw };
    }
    // For network/api errors, rethrow nicely without leaking too much
    throw new Error('Error communicating with AI service');
  }
}
