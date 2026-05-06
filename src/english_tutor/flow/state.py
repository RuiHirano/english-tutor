"""Summarize the current learning state for the flow-controller.

Returns JSON with everything the agent needs to decide what to do
next on a /start invocation:

  - profile: the user_profile row
  - active_materials: materials with mastery_level < 3 ordered by recency
  - phase_history: per active material, recent sessions (phase + dates)
  - new_vocab_count: per active material, count of vocabulary_items
    with last_appeared_at IS NULL (i.e., never asked)
  - mistakes: vocabulary_items the user got wrong recently
  - profile_missing: True if user_profile is empty (first run)

Usage:
    python -m english_tutor.flow.state
"""

from __future__ import annotations

import json
import sys

from english_tutor.db.connection import get_connection
from english_tutor.flow.mistakes import list_mistakes


def summarize() -> dict:
    with get_connection() as conn:
        profile_row = conn.execute("SELECT * FROM user_profile WHERE id = 1").fetchone()
        materials = conn.execute(
            "SELECT id, title, mastery_level, total_appearances, "
            "       last_appeared_at, started_at, ended_at, created_at "
            "  FROM materials "
            " WHERE mastery_level < 3 "
            " ORDER BY last_appeared_at DESC NULLS LAST, created_at DESC"
        ).fetchall()

        result = {
            "profile_missing": profile_row is None,
            "profile": dict(profile_row) if profile_row else None,
            "active_materials": [],
            "mistakes": list_mistakes(limit=30),
        }

        for m in materials:
            sessions = conn.execute(
                "SELECT phase, started_at, ended_at "
                "  FROM sessions "
                " WHERE material_id = ? "
                " ORDER BY started_at DESC LIMIT 20",
                (m["id"],),
            ).fetchall()
            new_vocab = conn.execute(
                "SELECT COUNT(*) AS c "
                "  FROM vocabulary_items "
                " WHERE material_id = ? AND last_appeared_at IS NULL",
                (m["id"],),
            ).fetchone()
            result["active_materials"].append(
                {
                    **dict(m),
                    "recent_sessions": [dict(s) for s in sessions],
                    "new_vocab_count": new_vocab["c"],
                }
            )

    return result


def main() -> int:
    json.dump(summarize(), sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
