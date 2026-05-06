"""Read or write the singleton user_profile row.

Usage:
    python -m english_tutor.flow.profile get
    echo '{"goal":"business","level":"B1","interests":"tech, travel"}' \
        | python -m english_tutor.flow.profile set
"""

from __future__ import annotations

import argparse
import json
import sys

from english_tutor.db.connection import get_connection


def get_profile() -> dict | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM user_profile WHERE id = 1").fetchone()
    return dict(row) if row else None


def set_profile(payload: dict) -> None:
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO user_profile (id, goal, level, interests) "
            "VALUES (1, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET "
            "  goal = excluded.goal, "
            "  level = excluded.level, "
            "  interests = excluded.interests",
            (payload["goal"], payload["level"], payload["interests"]),
        )
        conn.commit()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("get")
    sub.add_parser("set")

    args = parser.parse_args(argv)
    if args.cmd == "get":
        json.dump(get_profile(), sys.stdout, ensure_ascii=False)
    else:
        payload = json.load(sys.stdin)
        set_profile(payload)
        json.dump({"ok": True}, sys.stdout)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
