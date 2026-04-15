import { describe, expect, it } from 'vitest';
import { chunkIdsForFirestoreIn, FIRESTORE_IN_CHUNK_SIZE } from './firestoreInChunk';

describe('chunkIdsForFirestoreIn', () => {
  it('returns empty for empty input', () => {
    expect(chunkIdsForFirestoreIn([])).toEqual([]);
  });

  it('splits at Firestore in limit (10)', () => {
    const ids = Array.from({ length: 25 }, (_, i) => `id-${i}`);
    const chunks = chunkIdsForFirestoreIn(ids);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(FIRESTORE_IN_CHUNK_SIZE);
    expect(chunks[1]).toHaveLength(FIRESTORE_IN_CHUNK_SIZE);
    expect(chunks[2]).toHaveLength(5);
    expect(chunks.flat()).toEqual(ids);
  });

  it('preserves order within chunks', () => {
    const ids = ['a', 'b', 'c'];
    expect(chunkIdsForFirestoreIn(ids, 2)).toEqual([['a', 'b'], ['c']]);
  });

  it('throws for invalid maxPerChunk', () => {
    expect(() => chunkIdsForFirestoreIn(['a'], 0)).toThrow(RangeError);
  });
});
