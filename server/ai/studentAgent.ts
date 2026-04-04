import { openai, AI_MODEL } from './openaiClient.js';
import { buildStudentNotesPrompt, type StudentNotesParams } from './promptTemplates.js';

export interface StudentNotes {
  summary: string;
  keyConcepts: string[];
  importantQuestions: string[];
}

export class ValidationError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = 'ValidationError';
    this.status = status;
  }
}

export async function generateStudentNotes(params: StudentNotesParams): Promise<StudentNotes> {
  if (!params.topic || params.topic.trim() === '') {
    throw new ValidationError('topic is required', 400);
  }

  if (params.noteText && params.noteText.length > 10000) {
    throw new ValidationError('note text exceeds maximum length', 400);
  }

  const prompt = buildStudentNotesPrompt(params);

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
    
    let jsonString = raw.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(jsonString) as StudentNotes;
    
    return parsed;
  } catch (err: any) {
    if (err.name === 'SyntaxError' || err.message === 'Expected array') {
      throw { message: 'AI response parse error', raw };
    }
    throw new Error('Error communicating with AI service');
  }
}
