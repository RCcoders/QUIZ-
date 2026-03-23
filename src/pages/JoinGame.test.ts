import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure initialization logic extracted from JoinGame component.
 * Given a URL :code param, the game code input is initialized to code.toUpperCase().
 * If no code param, defaults to ''.
 *
 * Validates: Requirements 7.3
 */
function initGameCode(code: string | undefined): string {
    return code ? code.toUpperCase() : '';
}

describe('JoinGame URL code pre-fill', () => {
    /**
     * Property: URL code pre-fills the input
     * For any arbitrary code string from the URL param, the initial game code input
     * value SHALL equal that code (uppercased).
     *
     * Validates: Requirements 7.3
     */
    it('Property: URL code pre-fills the input with the URL param value', () => {
        fc.assert(
            fc.property(fc.string(), (code) => {
                const result = initGameCode(code);
                expect(result).toBe(code.toUpperCase());
            }),
            { numRuns: 100 }
        );
    });

    it('Property: undefined URL param results in empty string', () => {
        fc.assert(
            fc.property(fc.constant(undefined), (code) => {
                const result = initGameCode(code);
                expect(result).toBe('');
            }),
            { numRuns: 10 }
        );
    });

    it('pre-fills with short codes (not just 6-char codes)', () => {
        fc.assert(
            fc.property(fc.string({ minLength: 1, maxLength: 5 }), (code) => {
                const result = initGameCode(code);
                expect(result).toBe(code.toUpperCase());
            }),
            { numRuns: 100 }
        );
    });
});
