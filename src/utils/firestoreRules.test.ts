/**
 * Property-based tests for Firestore security rules owner isolation.
 *
 * Property 2: Security rules allow owner writes only
 * Validates: Requirements 2.3, 2.4, 2.5, 2.6
 *
 * Since @firebase/rules-unit-testing requires a running Firebase emulator,
 * this test parses the firestore.rules file as a string and uses fast-check
 * to verify that owner-check expressions are present for each collection.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read the rules file once at module load time
const rulesPath = resolve(__dirname, '../../firestore.rules');
const rulesContent = readFileSync(rulesPath, 'utf-8');

/**
 * Maps each collection to its expected owner-check expression and owner field name.
 */
const ownerCheckMap: Record<string, { expression: string; ownerField: string }> = {
  quizzes: {
    expression: 'request.auth.uid == resource.data.teacherId',
    ownerField: 'teacherId',
  },
  sessions: {
    expression: 'request.auth.uid == resource.data.hostId',
    ownerField: 'hostId',
  },
  participants: {
    expression: 'request.auth.uid == resource.data.uid',
    ownerField: 'uid',
  },
  answers: {
    expression: 'request.auth.uid == resource.data.studentId',
    ownerField: 'studentId',
  },
};

const collections = Object.keys(ownerCheckMap) as Array<keyof typeof ownerCheckMap>;

describe('firestore.rules — Property 2: Security rules allow owner writes only', () => {
  /**
   * Unit assertions: verify each collection's owner-check expression is present.
   * These serve as concrete examples before the property test.
   */
  it('quizzes: contains auth.uid == resource.data.teacherId', () => {
    expect(rulesContent).toContain('request.auth.uid == resource.data.teacherId');
  });

  it('sessions: contains auth.uid == resource.data.hostId', () => {
    expect(rulesContent).toContain('request.auth.uid == resource.data.hostId');
  });

  it('participants: contains auth.uid == resource.data.uid', () => {
    expect(rulesContent).toContain('request.auth.uid == resource.data.uid');
  });

  it('answers: contains auth.uid == resource.data.studentId', () => {
    expect(rulesContent).toContain('request.auth.uid == resource.data.studentId');
  });

  /**
   * Property 2: For any collection that requires owner-only writes, the rules file
   * contains the appropriate auth.uid == resource.data.{ownerField} expression.
   *
   * Validates: Requirements 2.3, 2.4, 2.5, 2.6
   */
  it('Property 2: for any owner-write collection, the rules file contains the owner-check expression', () => {
    fc.assert(
      fc.property(
        // Generate a collection name from the known set
        fc.constantFrom(...collections),
        (collection) => {
          const { expression } = ownerCheckMap[collection];
          return rulesContent.includes(expression);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: for any collection, the rules file contains a match block
   * for that collection, ensuring no collection is accidentally omitted.
   *
   * Validates: Requirements 2.3, 2.4, 2.5, 2.6
   */
  it('Property 2 (extended): for any owner-write collection, the rules file contains a match block for it', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...collections),
        (collection) => {
          // e.g. match /quizzes/{quizId}
          const matchPattern = `match /${collection}/`;
          return rulesContent.includes(matchPattern);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: for any collection, the owner-check expression appears inside
   * the correct collection's match block (not just anywhere in the file).
   *
   * Validates: Requirements 2.3, 2.4, 2.5, 2.6
   */
  it('Property 2 (scoped): owner-check expression appears within the correct collection block', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...collections),
        (collection) => {
          const { expression } = ownerCheckMap[collection];

          // Extract the block for this collection using a simple bracket-counting approach.
          // The match line looks like: match /quizzes/{quizId} {
          // We need the opening brace of the BLOCK BODY, not the {quizId} in the path.
          // Strategy: find the end of the match line (the newline), then find the first '{' after it.
          const matchStart = `match /${collection}/`;
          const startIdx = rulesContent.indexOf(matchStart);
          if (startIdx === -1) return false;

          // Find the end of the match declaration line
          const lineEnd = rulesContent.indexOf('\n', startIdx);
          if (lineEnd === -1) return false;

          // The block-opening brace is the last '{' on the match line (before the newline)
          const lineContent = rulesContent.slice(startIdx, lineEnd);
          const lastBraceOnLine = lineContent.lastIndexOf('{');
          if (lastBraceOnLine === -1) return false;
          const braceStart = startIdx + lastBraceOnLine;

          // Walk forward counting braces to find the closing brace of this block
          let depth = 0;
          let endIdx = braceStart;
          for (let i = braceStart; i < rulesContent.length; i++) {
            if (rulesContent[i] === '{') depth++;
            else if (rulesContent[i] === '}') {
              depth--;
              if (depth === 0) {
                endIdx = i;
                break;
              }
            }
          }

          const collectionBlock = rulesContent.slice(startIdx, endIdx + 1);
          return collectionBlock.includes(expression);
        }
      ),
      { numRuns: 100 }
    );
  });
});
