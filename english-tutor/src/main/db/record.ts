import type { MasteryLevel, RecordPayload } from '@shared/types';
import type { DatabaseSync } from 'node:sqlite';
import { getDb } from './connection';

const PROMOTE_TO_1 = 1; // 1 回正解で 認識
const PROMOTE_TO_2 = 3; // 3 回連続正解で 使用
const PROMOTE_TO_3 = 5; // 5 回連続正解で 自動化

function adjustMastery(db: DatabaseSync, vocabId: number, isCorrect: boolean): void {
  const row = db
    .prepare('SELECT mastery_level FROM vocabulary_items WHERE id = ?')
    .get(vocabId) as { mastery_level: MasteryLevel } | undefined;
  if (!row) return;
  const current = row.mastery_level;

  if (!isCorrect) {
    if (current > 0) {
      db.prepare('UPDATE vocabulary_items SET mastery_level = ? WHERE id = ?').run(
        current - 1,
        vocabId,
      );
    }
    return;
  }

  const recent = db
    .prepare(
      `SELECT is_correct FROM questions
        WHERE vocabulary_item_id = ?
        ORDER BY asked_at DESC LIMIT 10`,
    )
    .all(vocabId) as Array<{ is_correct: 0 | 1 }>;

  let consecutive = 0;
  for (const r of recent) {
    if (r.is_correct === 1) consecutive++;
    else break;
  }

  let next: MasteryLevel = current;
  if (current === 0 && consecutive >= PROMOTE_TO_1) next = 1;
  else if (current === 1 && consecutive >= PROMOTE_TO_2) next = 2;
  else if (current === 2 && consecutive >= PROMOTE_TO_3) next = 3;

  if (next !== current) {
    db.prepare('UPDATE vocabulary_items SET mastery_level = ? WHERE id = ?').run(next, vocabId);
  }
}

export function recordQuestion(p: RecordPayload): number {
  const db = getDb();
  db.exec('BEGIN');
  try {
    const result = db
      .prepare(
        `INSERT INTO questions
           (session_id, material_id, vocabulary_item_id, phase,
            question_text, correct_answer, user_answer, is_correct, feedback)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        p.sessionId,
        p.materialId,
        p.vocabularyItemId,
        p.phase,
        p.questionText,
        p.correctAnswer,
        p.userAnswer,
        p.isCorrect ? 1 : 0,
        p.feedback,
      );

    if (p.vocabularyItemId !== null) {
      db.prepare(
        `UPDATE vocabulary_items
            SET total_appearances = total_appearances + 1,
                last_appeared_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
      ).run(p.vocabularyItemId);
      adjustMastery(db, p.vocabularyItemId, p.isCorrect);
    }
    db.exec('COMMIT');
    return Number(result.lastInsertRowid);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
