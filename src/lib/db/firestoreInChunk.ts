/**
 * Troceo para queries Firestore `in` y `documentId() in` (máx. 10 valores por consulta).
 * Módulo sin dependencia de Firebase — apto para tests unitarios.
 */

export const FIRESTORE_IN_CHUNK_SIZE = 10;

export function chunkIdsForFirestoreIn<T>(ids: T[], maxPerChunk = FIRESTORE_IN_CHUNK_SIZE): T[][] {
  if (maxPerChunk < 1) throw new RangeError('maxPerChunk must be >= 1');
  const out: T[][] = [];
  for (let i = 0; i < ids.length; i += maxPerChunk) {
    out.push(ids.slice(i, i + maxPerChunk));
  }
  return out;
}
