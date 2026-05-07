import type { PhaseName } from '@shared/types';
import { getDb } from './connection';

export function openSession(materialId: number, phase: PhaseName): number {
  const db = getDb();
  // 同じ (material, phase) で開きっぱなしのセッションがあれば再利用する。
  // ended_at が NULL のまま残っているのは前回中断したセッション。
  const existing = db
    .prepare(
      `SELECT id FROM sessions
        WHERE material_id = ? AND phase = ? AND ended_at IS NULL
        ORDER BY started_at DESC LIMIT 1`,
    )
    .get(materialId, phase) as { id: number } | undefined;
  if (existing) {
    return Number(existing.id);
  }

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
