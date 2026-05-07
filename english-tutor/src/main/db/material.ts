import type { Material, SessionRecord, VocabItem, VocabItemDraft } from '@shared/types';
import type { CreateMaterialResult, MaterialWithVocab } from '@shared/ipc';
import { getDb } from './connection';

export function listMaterials(activeOnly = false): Material[] {
  const sql = activeOnly
    ? `SELECT id, title, script, total_appearances, last_appeared_at,
              mastery_level, started_at, ended_at, created_at
         FROM materials
        WHERE mastery_level < 3
        ORDER BY (last_appeared_at IS NULL), last_appeared_at DESC, created_at DESC`
    : `SELECT id, title, script, total_appearances, last_appeared_at,
              mastery_level, started_at, ended_at, created_at
         FROM materials
        ORDER BY (last_appeared_at IS NULL), last_appeared_at DESC, created_at DESC`;
  return getDb().prepare(sql).all() as unknown as Material[];
}

export function getMaterial(id: number): MaterialWithVocab | null {
  const row = getDb().prepare('SELECT * FROM materials WHERE id = ?').get(id) as
    | unknown as Material | undefined;
  if (!row) return null;
  const items = getDb()
    .prepare('SELECT * FROM vocabulary_items WHERE material_id = ? ORDER BY id')
    .all(id) as unknown as VocabItem[];
  const sessions = getDb()
    .prepare('SELECT * FROM sessions WHERE material_id = ? ORDER BY started_at DESC')
    .all(id) as unknown as SessionRecord[];
  return { ...row, vocabulary_items: items, sessions };
}

export function createMaterial(payload: {
  title: string;
  script: string;
  items: VocabItemDraft[];
}): CreateMaterialResult {
  const db = getDb();
  let materialId = 0;
  const itemIds: number[] = [];
  db.exec('BEGIN');
  try {
    const ins = db.prepare('INSERT INTO materials (title, script) VALUES (?, ?)');
    const result = ins.run(payload.title, payload.script);
    materialId = Number(result.lastInsertRowid);

    const insItem = db.prepare(
      'INSERT INTO vocabulary_items (material_id, term, meaning, type) VALUES (?, ?, ?, ?)',
    );
    for (const item of payload.items) {
      const r = insItem.run(materialId, item.term, item.meaning ?? null, item.type ?? null);
      itemIds.push(Number(r.lastInsertRowid));
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return { materialId, vocabularyItemIds: itemIds };
}

export function setMaterialMastery(id: number, level: number): void {
  const db = getDb();
  if (level >= 3) {
    db.prepare(
      'UPDATE materials SET mastery_level = ?, ended_at = CURRENT_TIMESTAMP WHERE id = ?',
    ).run(level, id);
  } else {
    db.prepare('UPDATE materials SET mastery_level = ? WHERE id = ?').run(level, id);
  }
}
