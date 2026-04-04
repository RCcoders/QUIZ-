import { openai, AI_MODEL } from './openaiClient.js';
import { buildAdaptiveQuizPrompt, type AdaptiveQuizParams } from './promptTemplates.js';
import ScoreRecord from '../models/ScoreRecord.js';
import type { MCQQuestion } from './teacherAgent.js';

export interface WeakTopicResult {
  subject: string;
  avgPercentage: number;
}

export async function getWeakTopics(userId: string): Promise<WeakTopicResult[]> {
  const records = await ScoreRecord.find({ userId, subject: { $exists: true, $ne: '' } }).sort({ completedAt: -1 }).lean();

  const subjectMap = new Map<string, number[]>();

  for (const record of records) {
    if (!record.subject) continue;
    const scores = subjectMap.get(record.subject) || [];
    if (scores.length < 10) {
      scores.push(record.percentage);
      subjectMap.set(record.subject, scores);
    }
  }

  const weakTopics: WeakTopicResult[] = [];
  for (const [subject, scores] of subjectMap.entries()) {
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    if (avg < 70) {
      weakTopics.push({ subject, avgPercentage: avg });
    }
  }

  return weakTopics;
}

export async function generateAdaptiveQuiz(
  userId: string, 
  params: { count: number; difficulty?: 'easy' | 'medium' | 'hard'; fallbackTopic?: string }
): Promise<MCQQuestion[]> {
  const weakTopics = await getWeakTopics(userId);
  const weakTopicNames = weakTopics.map(wt => wt.subject);

  const promptParams: AdaptiveQuizParams = {
    weakTopics: weakTopicNames,
    count: params.count,
    ...(params.difficulty !== undefined && { difficulty: params.difficulty }),
    ...(params.fallbackTopic !== undefined && { fallbackTopic: params.fallbackTopic }),
  };

  const prompt = buildAdaptiveQuizPrompt(promptParams);

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

    const parsed = JSON.parse(jsonString) as MCQQuestion[];
    if (!Array.isArray(parsed)) {
      throw new Error('Expected array');
    }
    
    return parsed;
  } catch (err: any) {
    if (err.name === 'SyntaxError' || err.message === 'Expected array') {
      throw { message: 'AI response parse error', raw };
    }
    throw new Error('Error communicating with AI service');
  }
}
