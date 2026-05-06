"""Create a new material along with its extracted vocabulary_items.

Receives a JSON payload on stdin:
    {
      "title": "Morning routine talk",
      "script": "...",
      "items": [
        {"term": "get the hang of it", "meaning": "...", "type": "expression"},
        {"term": "consistent",          "meaning": "...", "type": "vocab"},
        {"term": "have been + ~ing",    "meaning": "...", "type": "grammar"}
      ]
    }

Usage:
    cat material.json | python -m english_tutor.flow.material
"""

from __future__ import annotations

import json
import sys

from english_tutor.db.connection import get_connection


def create_material(payload: dict) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO materials (title, script) VALUES (?, ?)",
            (payload["title"], payload["script"]),
        )
        material_id = int(cur.lastrowid)

        item_ids = []
        for item in payload.get("items", []):
            cur = conn.execute(
                "INSERT INTO vocabulary_items "
                "  (material_id, term, meaning, type) "
                "VALUES (?, ?, ?, ?)",
                (material_id, item["term"], item.get("meaning"), item.get("type")),
            )
            item_ids.append(int(cur.lastrowid))

        conn.commit()
    return {"material_id": material_id, "vocabulary_item_ids": item_ids}


def main() -> int:
    payload = json.load(sys.stdin)
    result = create_material(payload)
    json.dump(result, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
