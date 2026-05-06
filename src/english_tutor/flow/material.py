"""Create or read materials.

Usage:
    cat material.json | python -m english_tutor.flow.material create
    python -m english_tutor.flow.material get --id M

`create` payload (stdin JSON):
    {
      "title": "Morning routine talk",
      "script": "...",
      "items": [
        {"term": "get the hang of it", "meaning": "...", "type": "expression"},
        {"term": "consistent",          "meaning": "...", "type": "vocab"},
        {"term": "have been + ~ing",    "meaning": "...", "type": "grammar"}
      ]
    }

`get` returns the materials row plus its vocabulary_items.
"""

from __future__ import annotations

import argparse
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


def get_material(material_id: int) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM materials WHERE id = ?", (material_id,)
        ).fetchone()
        if row is None:
            return None
        items = conn.execute(
            "SELECT * FROM vocabulary_items WHERE material_id = ? ORDER BY id",
            (material_id,),
        ).fetchall()
    return {**dict(row), "vocabulary_items": [dict(i) for i in items]}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("create")
    p_get = sub.add_parser("get")
    p_get.add_argument("--id", type=int, required=True)

    args = parser.parse_args(argv)
    if args.cmd == "create":
        payload = json.load(sys.stdin)
        result = create_material(payload)
    else:
        result = get_material(args.id)
    json.dump(result, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
