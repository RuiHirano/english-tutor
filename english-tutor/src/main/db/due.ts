import type { VocabDue, VocabType } from '@shared/types';
import { getDb } from './connection';
import { parseExamples } from './material';

const NEW_ITEM_SCORE = 1e9;

interface RawRow {
  id: number;
  material_id: number | null;
  term: string;
  meaning: string | null;
  type: VocabType | null;
  examples: string | null;
  mastery_level: 0 | 1 | 2 | 3;
  total_appearances: number;
  last_appeared_at: string | null;
  created_at: string;
  days_elapsed: number | null;
}

export function pickDue(opts: {
  type?: VocabType;
  materialId?: number;
  limit: number;
}): VocabDue[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (opts.type !== undefined) {
    conditions.push('type = ?');
    params.push(opts.type);
  }
  if (opts.materialId !== undefined) {
    conditions.push('material_id = ?');
    params.push(opts.materialId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = getDb()
    .prepare(
      `SELECT id, material_id, term, meaning, type, examples,
              mastery_level, total_appearances, last_appeared_at, created_at,
              CASE
                WHEN last_appeared_at IS NULL THEN NULL
                ELSE (julianday('now') - julianday(last_appeared_at))
              END AS days_elapsed
         FROM vocabulary_items
         ${where}`,
    )
    .all(...params) as unknown as RawRow[];

  const scored: VocabDue[] = rows.map((r) => {
    const score =
      r.last_appeared_at === null || r.days_elapsed === null
        ? NEW_ITEM_SCORE
        : r.days_elapsed - Math.pow(2, r.mastery_level);
    return {
      id: r.id,
      material_id: r.material_id,
      term: r.term,
      meaning: r.meaning,
      type: r.type,
      examples: parseExamples(r.examples),
      mastery_level: r.mastery_level,
      total_appearances: r.total_appearances,
      last_appeared_at: r.last_appeared_at,
      created_at: r.created_at,
      due_score: score,
    };
  });

  scored.sort((a, b) => b.due_score - a.due_score);
  return scored.slice(0, opts.limit);
}
