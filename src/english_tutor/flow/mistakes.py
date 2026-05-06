"""List vocabulary_items that the user got wrong and hasn't recovered yet.

Used by material-new (next 教材生成 input) and phase-speaking (next 工程6・7 で再出題).

Definition: a vocabulary_item has a most-recent answer of is_correct=0
across the questions log, with no later is_correct=1 question for the
same item.

Usage:
    python -m english_tutor.flow.mistakes --limit 20
"""

from __future__ import annotations

import argparse
import json
import sys

from english_tutor.db.connection import get_connection

QUERY = """
SELECT v.id, v.material_id, v.term, v.meaning, v.type,
       v.mastery_level, v.total_appearances, v.last_appeared_at,
       last_q.last_failed_at
  FROM vocabulary_items v
  JOIN (
    SELECT vocabulary_item_id, MAX(asked_at) AS last_failed_at
      FROM questions
     WHERE is_correct = 0
       AND vocabulary_item_id IS NOT NULL
     GROUP BY vocabulary_item_id
  ) last_q ON last_q.vocabulary_item_id = v.id
 WHERE NOT EXISTS (
   SELECT 1 FROM questions q2
    WHERE q2.vocabulary_item_id = v.id
      AND q2.is_correct = 1
      AND q2.asked_at > last_q.last_failed_at
 )
 ORDER BY last_q.last_failed_at DESC
 LIMIT :limit
"""


def list_mistakes(limit: int = 50) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(QUERY, {"limit": limit}).fetchall()
    return [dict(r) for r in rows]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=50)
    args = parser.parse_args(argv)

    items = list_mistakes(limit=args.limit)
    json.dump(items, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
