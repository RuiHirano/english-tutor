"""Record a Q&A and update the linked vocabulary_item statistics.

The agent calls this after each user answer. Inputs are passed via
stdin as JSON to keep argv tidy for long question/answer text:

    echo '{
      "session_id": 17,
      "material_id": 3,
      "vocabulary_item_id": 42,
      "phase": "vocab",
      "question_text": "What does \"hang of it\" mean?",
      "correct_answer": "to become familiar with something",
      "user_answer": "I don'\''t know",
      "is_correct": 0,
      "feedback": "Try thinking about acquiring a new skill."
    }' | python -m english_tutor.flow.record
"""

from __future__ import annotations

import json
import sys

from english_tutor.db.connection import get_connection


def record(payload: dict) -> int:
    is_correct = 1 if payload.get("is_correct") else 0
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO questions "
            "  (session_id, material_id, vocabulary_item_id, phase, "
            "   question_text, correct_answer, user_answer, is_correct, feedback) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                payload["session_id"],
                payload["material_id"],
                payload.get("vocabulary_item_id"),
                payload["phase"],
                payload["question_text"],
                payload["correct_answer"],
                payload.get("user_answer"),
                is_correct,
                payload.get("feedback"),
            ),
        )
        if payload.get("vocabulary_item_id") is not None:
            conn.execute(
                "UPDATE vocabulary_items "
                "   SET total_appearances = total_appearances + 1, "
                "       last_appeared_at = CURRENT_TIMESTAMP "
                " WHERE id = ?",
                (payload["vocabulary_item_id"],),
            )
        conn.commit()
        return int(cur.lastrowid)


def main() -> int:
    payload = json.load(sys.stdin)
    qid = record(payload)
    json.dump({"question_id": qid}, sys.stdout)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
