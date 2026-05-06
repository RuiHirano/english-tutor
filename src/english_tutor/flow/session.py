"""Open / close session rows.

Each (material_id, phase) engagement is a session. The agent calls
`open` at the start of a phase, `close` when leaving it. Returns the
session_id so subsequent question records can link to it.

Usage:
    python -m english_tutor.flow.session open --material-id 3 --phase vocab
    python -m english_tutor.flow.session close --session-id 17
"""

from __future__ import annotations

import argparse
import json
import sys

from english_tutor.db.connection import get_connection


def open_session(material_id: int, phase: str) -> int:
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO sessions (material_id, phase) VALUES (?, ?)",
            (material_id, phase),
        )
        conn.execute(
            "UPDATE materials "
            "   SET total_appearances = total_appearances + 1, "
            "       last_appeared_at = CURRENT_TIMESTAMP, "
            "       started_at = COALESCE(started_at, CURRENT_TIMESTAMP) "
            " WHERE id = ?",
            (material_id,),
        )
        conn.commit()
        return int(cur.lastrowid)


def close_session(session_id: int) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE sessions SET ended_at = CURRENT_TIMESTAMP WHERE id = ?",
            (session_id,),
        )
        conn.commit()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_open = sub.add_parser("open")
    p_open.add_argument("--material-id", type=int, required=True)
    p_open.add_argument("--phase", required=True)

    p_close = sub.add_parser("close")
    p_close.add_argument("--session-id", type=int, required=True)

    args = parser.parse_args(argv)
    if args.cmd == "open":
        sid = open_session(args.material_id, args.phase)
        json.dump({"session_id": sid}, sys.stdout)
        sys.stdout.write("\n")
    else:
        close_session(args.session_id)
        json.dump({"closed": args.session_id}, sys.stdout)
        sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
