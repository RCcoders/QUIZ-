/**
 * Input sanitizer for AI prompt inputs.
 * Strips known prompt injection patterns and truncates to MAX_INPUT_CHARS.
 *
 * Requirement 3.6: Strip/escape characters that could constitute prompt injection.
 * Requirement 11.2: Truncate inputs exceeding the configurable character limit.
 */

export const MAX_INPUT_CHARS = 20_000;

/**
 * Known prompt injection patterns (case-insensitive).
 * Each entry is replaced with an empty string.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+previous\s+instructions?/gi,
  /forget\s+your\s+instructions?/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /override\s+(previous\s+)?instructions?/gi,
  /you\s+are\s+now\s+in\s+(developer|jailbreak|dan)\s+mode/gi,
  /act\s+as\s+(if\s+you\s+(are|were)\s+)?a\s+(different|new|unrestricted)\s+(ai|model|assistant)/gi,
  /do\s+not\s+follow\s+(your\s+)?(previous\s+)?instructions?/gi,
  /new\s+instructions?:/gi,
  /system\s+prompt:/gi,
  /\[system\]/gi,
  /<\s*system\s*>/gi,
];

/**
 * Sanitizes a string input before it is passed to an AI prompt.
 * - Strips known prompt injection sequences (case-insensitive).
 * - Truncates the result to MAX_INPUT_CHARS characters.
 *
 * @param input - The raw string to sanitize.
 * @returns The sanitized, truncated string.
 */
export function sanitizePromptInput(input: string): string {
  let sanitized = input;

  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  if (sanitized.length > MAX_INPUT_CHARS) {
    sanitized = sanitized.slice(0, MAX_INPUT_CHARS);
  }

  return sanitized;
}
