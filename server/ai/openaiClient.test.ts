import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Validates: Requirements 7.3

describe('openaiClient', () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env['OPENAI_API_KEY'];
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env['OPENAI_API_KEY'];
    } else {
      process.env['OPENAI_API_KEY'] = originalKey;
    }
    vi.resetModules();
  });

  it('logs a warning when OPENAI_API_KEY is not set', async () => {
    delete process.env['OPENAI_API_KEY'];
    vi.resetModules();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await import('./openaiClient.js');

    expect(warnSpy).toHaveBeenCalledWith(
      'OPENAI_API_KEY is not set — AI agent routes will fail'
    );

    warnSpy.mockRestore();
  });

  it('does not warn when OPENAI_API_KEY is set', async () => {
    process.env['OPENAI_API_KEY'] = 'test-key';
    vi.resetModules();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await import('./openaiClient.js');

    expect(warnSpy).not.toHaveBeenCalledWith(
      'OPENAI_API_KEY is not set — AI agent routes will fail'
    );

    warnSpy.mockRestore();
  });
});
