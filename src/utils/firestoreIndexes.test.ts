import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read and parse firestore.indexes.json from project root
const indexesPath = resolve(__dirname, '../../firestore.indexes.json');
const indexesJson = JSON.parse(readFileSync(indexesPath, 'utf-8'));

describe('firestore.indexes.json', () => {
  it('contains exactly 3 index definitions', () => {
    expect(Array.isArray(indexesJson.indexes)).toBe(true);
    expect(indexesJson.indexes).toHaveLength(3);
  });

  it('sessions index has correct collectionGroup, queryScope, and fields', () => {
    const idx = indexesJson.indexes.find((i: { collectionGroup: string }) => i.collectionGroup === 'sessions');
    expect(idx).toBeDefined();
    expect(idx.queryScope).toBe('COLLECTION');
    expect(idx.fields).toEqual([
      { fieldPath: 'hostId', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' },
    ]);
  });

  it('answers index has correct collectionGroup, queryScope, and fields', () => {
    const idx = indexesJson.indexes.find((i: { collectionGroup: string }) => i.collectionGroup === 'answers');
    expect(idx).toBeDefined();
    expect(idx.queryScope).toBe('COLLECTION');
    expect(idx.fields).toEqual([
      { fieldPath: 'sessionId', order: 'ASCENDING' },
      { fieldPath: 'submittedAt', order: 'ASCENDING' },
    ]);
  });

  it('participants index has correct collectionGroup, queryScope, and fields', () => {
    const idx = indexesJson.indexes.find((i: { collectionGroup: string }) => i.collectionGroup === 'participants');
    expect(idx).toBeDefined();
    expect(idx.queryScope).toBe('COLLECTION');
    expect(idx.fields).toEqual([
      { fieldPath: 'sessionId', order: 'ASCENDING' },
      { fieldPath: 'score', order: 'DESCENDING' },
    ]);
  });
});
