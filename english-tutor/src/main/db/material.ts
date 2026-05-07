import type {
  ExampleSentence,
  Material,
  SessionRecord,
  VocabItem,
  VocabItemDraft,
} from '@shared/types';
import type { CreateMaterialResult, MaterialWithVocab } from '@shared/ipc';
import { getDb } from './connection';

interface RawVocabRow extends Omit<VocabItem, 'examples'> {
  examples: string | null;
}

export function parseExamples(raw: string | null | undefined): ExampleSentence[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is ExampleSentence =>
        typeof e === 'object' && e !== null && typeof e.en === 'string' && typeof e.ja === 'string',
    );
  } catch {
    return [];
  }
}

export function hydrateVocab(row: RawVocabRow): VocabItem {
  return { ...row, examples: parseExamples(row.examples) };
}

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
  const rawItems = getDb()
    .prepare('SELECT * FROM vocabulary_items WHERE material_id = ? ORDER BY id')
    .all(id) as unknown as RawVocabRow[];
  const items: VocabItem[] = rawItems.map(hydrateVocab);
  const sessions = getDb()
    .prepare('SELECT * FROM sessions WHERE material_id = ? ORDER BY started_at DESC')
    .all(id) as unknown as SessionRecord[];
  return { ...row, vocabulary_items: items, sessions };
}

export function createMaterial(payload: {
  title: string;
  script: string;
  script_ja?: string;
  items: VocabItemDraft[];
}): CreateMaterialResult {
  const db = getDb();
  let materialId = 0;
  const itemIds: number[] = [];
  db.exec('BEGIN');
  try {
    const ins = db.prepare(
      'INSERT INTO materials (title, script, script_ja) VALUES (?, ?, ?)',
    );
    const result = ins.run(payload.title, payload.script, payload.script_ja ?? null);
    materialId = Number(result.lastInsertRowid);

    const insItem = db.prepare(
      'INSERT INTO vocabulary_items (material_id, term, meaning, type, examples) VALUES (?, ?, ?, ?, ?)',
    );
    for (const item of payload.items) {
      const examplesJson = item.examples && item.examples.length > 0
        ? JSON.stringify(item.examples)
        : null;
      const r = insItem.run(
        materialId,
        item.term,
        item.meaning ?? null,
        item.type ?? null,
        examplesJson,
      );
      itemIds.push(Number(r.lastInsertRowid));
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return { materialId, vocabularyItemIds: itemIds };
}

export interface MaterialWithProgress extends Material {
  completed_phases: string[];
  vocab_count: number;
}

export function listMaterialsWithProgress(activeOnly = false): MaterialWithProgress[] {
  const where = activeOnly ? 'WHERE m.mastery_level < 3' : '';
  const rows = getDb()
    .prepare(
      `SELECT m.id, m.title, m.script, m.script_ja,
              m.total_appearances, m.last_appeared_at, m.mastery_level,
              m.started_at, m.ended_at, m.created_at,
              (SELECT GROUP_CONCAT(DISTINCT s.phase)
                 FROM sessions s
                WHERE s.material_id = m.id AND s.ended_at IS NOT NULL) AS completed_phases_csv,
              (SELECT COUNT(*) FROM vocabulary_items WHERE material_id = m.id) AS vocab_count
         FROM materials m
         ${where}
        ORDER BY (m.last_appeared_at IS NULL), m.last_appeared_at DESC, m.created_at DESC`,
    )
    .all() as unknown as Array<
      Material & { completed_phases_csv: string | null; vocab_count: number }
    >;

  return rows.map(({ completed_phases_csv, vocab_count, ...m }) => ({
    ...m,
    completed_phases: completed_phases_csv ? completed_phases_csv.split(',').filter(Boolean) : [],
    vocab_count,
  }));
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
