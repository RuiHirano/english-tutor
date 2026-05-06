"""Pick the most-due vocabulary_items for the current phase.

Scoring (PLAN §6):
    interval_days = 2 ** mastery_level             # 0:1d, 1:2d, 2:4d, 3:8d
    days_elapsed  = now - last_appeared_at
    due_score     = days_elapsed - interval_days   # >0 means overdue

New items (last_appeared_at IS NULL) get max priority.

Usage:
    python -m english_tutor.flow.due --type vocab --limit 10
    python -m english_tutor.flow.due --type expression --limit 5 --material-id 3
"""

from __future__ import annotations

import argparse
import json
import sys

from english_tutor.db.connection import get_connection

QUERY = """
SELECT id, material_id, term, meaning, type,
       mastery_level, total_appearances, last_appeared_at,
       CASE
         WHEN last_appeared_at IS NULL THEN 1e9
         ELSE (julianday('now') - julianday(last_appeared_at))
              - POWER(2, mastery_level)
       END AS due_score
  FROM vocabulary_items
 WHERE (:type IS NULL OR type = :type)
   AND (:material_id IS NULL OR material_id = :material_id)
 ORDER BY due_score DESC
 LIMIT :limit
"""


def pick_due(item_type: str | None = None, limit: int = 10, material_id: int | None = None) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            QUERY,
            {"type": item_type, "limit": limit, "material_id": material_id},
        ).fetchall()
    return [dict(r) for r in rows]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", choices=["vocab", "grammar", "expression"], default=None)
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--material-id", type=int, default=None)
    args = parser.parse_args(argv)

    items = pick_due(item_type=args.type, limit=args.limit, material_id=args.material_id)
    json.dump(items, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
