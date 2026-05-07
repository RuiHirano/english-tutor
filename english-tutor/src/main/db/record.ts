import type { RecordPayload } from '@shared/types';
import { getDb } from './connection';

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
    }
    db.exec('COMMIT');
    return Number(result.lastInsertRowid);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
