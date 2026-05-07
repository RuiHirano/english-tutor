import type { VocabMistake } from '@shared/types';
import { getDb } from './connection';

const QUERY = `
SELECT v.id, v.material_id, v.term, v.meaning, v.type,
       last_q.last_question_text,
       last_q.last_correct_answer,
       last_q.last_user_answer,
       last_q.last_feedback,
       last_q.last_failed_at AS last_asked_at
  FROM vocabulary_items v
  JOIN (
    SELECT q.vocabulary_item_id,
           MAX(q.asked_at) AS last_failed_at,
           MAX(CASE WHEN q.asked_at = (
                 SELECT MAX(q3.asked_at)
                   FROM questions q3
                  WHERE q3.vocabulary_item_id = q.vocabulary_item_id
                    AND q3.is_correct = 0
               ) THEN q.question_text END) AS last_question_text,
           MAX(CASE WHEN q.asked_at = (
                 SELECT MAX(q3.asked_at)
                   FROM questions q3
                  WHERE q3.vocabulary_item_id = q.vocabulary_item_id
                    AND q3.is_correct = 0
               ) THEN q.correct_answer END) AS last_correct_answer,
           MAX(CASE WHEN q.asked_at = (
                 SELECT MAX(q3.asked_at)
                   FROM questions q3
                  WHERE q3.vocabulary_item_id = q.vocabulary_item_id
                    AND q3.is_correct = 0
               ) THEN q.user_answer END) AS last_user_answer,
           MAX(CASE WHEN q.asked_at = (
                 SELECT MAX(q3.asked_at)
                   FROM questions q3
                  WHERE q3.vocabulary_item_id = q.vocabulary_item_id
                    AND q3.is_correct = 0
               ) THEN q.feedback END) AS last_feedback
      FROM questions q
     WHERE q.is_correct = 0
       AND q.vocabulary_item_id IS NOT NULL
     GROUP BY q.vocabulary_item_id
  ) last_q ON last_q.vocabulary_item_id = v.id
 WHERE NOT EXISTS (
   SELECT 1 FROM questions q2
    WHERE q2.vocabulary_item_id = v.id
      AND q2.is_correct = 1
      AND q2.asked_at > last_q.last_failed_at
 )
 ORDER BY last_q.last_failed_at DESC
 LIMIT ?`;

export function listMistakes(limit = 50): VocabMistake[] {
  return getDb().prepare(QUERY).all(limit) as unknown as VocabMistake[];
}
