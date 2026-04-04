import { OpenAI } from 'openai';

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
const usingOllama = Boolean(ollamaBaseUrl);

if (usingOllama) {
  console.info(`AI agents using Ollama at ${ollamaBaseUrl} (model: ${process.env.OLLAMA_MODEL ?? 'llama3.2'})`);
} else if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set — AI agent routes will fail');
}

export const openai = new OpenAI(
  usingOllama
    ? {
        baseURL: `${ollamaBaseUrl}/v1`,
        apiKey: 'ollama', // required by the SDK but ignored by Ollama
      }
    : {
        apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_prevent_crash_if_not_set',
      }
);

// The model to use — overridable per-request but this default is read by agents
export const AI_MODEL = usingOllama
  ? (process.env.OLLAMA_MODEL ?? 'llama3.2')
  : 'gpt-4o-mini';
