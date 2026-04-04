export interface TeacherQuizParams {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  questionType: 'mcq' | 'subjective' | 'poll';
  context?: string;
}

export function buildTeacherQuizPrompt(params: TeacherQuizParams): string {
  let prompt = `You are an expert teacher creating a quiz.
Topic: ${params.topic}
Difficulty: ${params.difficulty}
Number of Questions: ${params.count}
Question Type: ${params.questionType}
`;

  if (params.context) {
    prompt += `\nUse the following extracted text as context for the questions:\n${params.context}\n`;
  }

  prompt += `
Return raw JSON ONLY. Do not wrap the JSON in markdown formatting, code blocks, or include any extra text.

The JSON format must be an array of objects.

`;

  if (params.questionType === 'mcq') {
    prompt += `Schema for each object:
{
  "questionText": "string",
  "options": ["string", "string", "string", "string"], (Exactly 4 options)
  "correctAnswer": "A" | "B" | "C" | "D", (Corresponds to options 0, 1, 2, 3)
  "explanation": "string",
  "difficulty": "${params.difficulty}",
  "topic": "${params.topic}"
}`;
  } else if (params.questionType === 'subjective') {
    prompt += `Schema for each object:
{
  "questionText": "string",
  "modelAnswer": "string",
  "rubric": "string",
  "difficulty": "${params.difficulty}",
  "topic": "${params.topic}"
}`;
  } else if (params.questionType === 'poll') {
    prompt += `Schema for each object:
{
  "questionText": "string",
  "options": ["string", "string", "string"], (Between 2 and 6 options)
  "topic": "${params.topic}"
}`;
  }

  return prompt;
}


export interface StudentNotesParams {
  topic: string;
  noteText?: string;
}

export function buildStudentNotesPrompt(params: StudentNotesParams): string {
  let prompt = `You are a helpful tutor generating study notes.
Topic: ${params.topic}
`;

  if (params.noteText) {
    prompt += `\nBase your notes on the following text:\n${params.noteText}\n`;
  }

  prompt += `
Return raw JSON ONLY. Do not wrap the JSON in markdown formatting, code blocks, or include any extra text.

Schema:
{
  "summary": "string (A concise overview of the topic)",
  "keyConcepts": ["string", "string", ...] (An array of key concepts),
  "importantQuestions": ["string", "string", ...] (An array of important questions to test understanding)
}`;

  return prompt;
}


export interface AdaptiveQuizParams {
  weakTopics: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  count: number;
  fallbackTopic?: string;
}

export function buildAdaptiveQuizPrompt(params: AdaptiveQuizParams): string {
  let prompt = `You are an adaptive AI generating a personalized quiz.
Number of Questions: ${params.count}
`;

  if (params.difficulty) {
    prompt += `Difficulty constraint: Exactly "${params.difficulty}" for ALL questions.\n`;
  } else {
    prompt += `Difficulty: Vary the difficulty appropriately, or use medium.\n`;
  }

  if (params.weakTopics.length > 0) {
    prompt += `The student is weak in the following topics: ${params.weakTopics.join(', ')}.
At least 60% of the questions MUST be about these weak topics. The rest can be related general questions.
`;
  } else if (params.fallbackTopic) {
    prompt += `Topic: ${params.fallbackTopic}.
`;
  } else {
    prompt += `Topic: General Knowledge.
`;
  }

  prompt += `
Return raw JSON ONLY. Do not wrap the JSON in markdown formatting, code blocks, or include any extra text.

The JSON format must be an array of objects.

Schema for each object (MCQ format):
{
  "questionText": "string",
  "options": ["string", "string", "string", "string"], (Exactly 4 options)
  "correctAnswer": "A" | "B" | "C" | "D", (Corresponds to options 0, 1, 2, 3)
  "explanation": "string",
  "difficulty": "easy" | "medium" | "hard",
  "topic": "string" (Specify the topic being tested)
}`;

  return prompt;
}
