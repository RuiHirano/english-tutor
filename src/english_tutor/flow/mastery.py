"""Update mastery_level on a vocabulary_item or material.

mastery_level is *not* derived per-answer; the agent inspects the
recent questions log and explicitly bumps it when patterns warrant
(e.g., several consecutive correct answers across different question
forms).

Usage:
    python -m english_tutor.flow.mastery vocab --id 42 --level 2
    python -m english_tutor.flow.mastery material --id 3  --level 3
"""

from __future__ import annotations

import argparse
import json
import sys

from english_tutor.db.connection import get_connection


def set_vocab_level(vocab_id: int, level: int) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE vocabulary_items SET mastery_level = ? WHERE id = ?",
            (level, vocab_id),
        )
        conn.commit()


def set_material_level(material_id: int, level: int) -> None:
    with get_connection() as conn:
        ended_clause = ", ended_at = CURRENT_TIMESTAMP" if level >= 3 else ""
        conn.execute(
            f"UPDATE materials SET mastery_level = ?{ended_clause} WHERE id = ?",
            (level, material_id),
        )
        conn.commit()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="kind", required=True)
    for name in ("vocab", "material"):
        p = sub.add_parser(name)
        p.add_argument("--id", type=int, required=True)
        p.add_argument("--level", type=int, required=True, choices=[0, 1, 2, 3])
    args = parser.parse_args(argv)

    if args.kind == "vocab":
        set_vocab_level(args.id, args.level)
    else:
        set_material_level(args.id, args.level)
    json.dump({"ok": True, "kind": args.kind, "id": args.id, "level": args.level}, sys.stdout)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
