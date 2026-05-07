import type {
  DailyActivity,
  MasteryDistribution,
  MasteryLevel,
  OverallStats,
} from '@shared/types';
import { getDb } from './connection';

export function overallStats(): OverallStats {
  const db = getDb();
  const m = db.prepare('SELECT COUNT(*) AS n FROM materials').get() as { n: number };
  const v = db
    .prepare('SELECT COUNT(*) AS n FROM vocabulary_items')
    .get() as { n: number };
  const s = db.prepare('SELECT COUNT(*) AS n FROM sessions').get() as { n: number };
  const q = db.prepare('SELECT COUNT(*) AS n FROM questions').get() as { n: number };
  const c = db
    .prepare('SELECT COUNT(*) AS n FROM questions WHERE is_correct = 1')
    .get() as { n: number };

  return {
    total_materials: m.n,
    total_vocabulary_items: v.n,
    total_sessions: s.n,
    total_questions: q.n,
    correct_questions: c.n,
    accuracy: q.n === 0 ? 0 : c.n / q.n,
  };
}

export function dailyActivity(days: number): DailyActivity[] {
  const sql = `
    SELECT DATE(started_at) AS date,
           COUNT(*) AS sessions,
           (SELECT COUNT(*)
              FROM questions q
             WHERE DATE(q.asked_at) = DATE(s.started_at)) AS questions,
           (SELECT COUNT(*)
              FROM questions q
             WHERE DATE(q.asked_at) = DATE(s.started_at) AND q.is_correct = 1) AS correct
      FROM sessions s
     WHERE s.started_at >= DATE('now', ?)
     GROUP BY date
     ORDER BY date`;
  return getDb().prepare(sql).all(`-${days} days`) as unknown as DailyActivity[];
}

export function masteryDistribution(
  scope: 'materials' | 'vocabulary_items',
): MasteryDistribution[] {
  const table = scope === 'materials' ? 'materials' : 'vocabulary_items';
  return getDb()
    .prepare(
      `SELECT mastery_level, COUNT(*) AS n FROM ${table}
        GROUP BY mastery_level ORDER BY mastery_level`,
    )
    .all() as unknown as Array<{ mastery_level: MasteryLevel; n: number }>;
}
