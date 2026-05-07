import type { PhaseName } from '@shared/types';
import { getDb } from './connection';

export function openSession(materialId: number, phase: PhaseName): number {
  const db = getDb();
  db.exec('BEGIN');
  try {
    const result = db
      .prepare('INSERT INTO sessions (material_id, phase) VALUES (?, ?)')
      .run(materialId, phase);
    db.prepare(
      `UPDATE materials
          SET total_appearances = total_appearances + 1,
              last_appeared_at = CURRENT_TIMESTAMP,
              started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
        WHERE id = ?`,
    ).run(materialId);
    db.exec('COMMIT');
    return Number(result.lastInsertRowid);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function closeSession(sessionId: number): void {
  getDb()
    .prepare('UPDATE sessions SET ended_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(sessionId);
}
