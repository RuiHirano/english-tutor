"""Read-only DB helpers for the dashboard.

Re-exports the shared connection helper but adds a `@st.cache_data`
wrapper around common queries so the dashboard stays snappy.
"""

from __future__ import annotations

import streamlit as st

from english_tutor.db.connection import get_connection


def _rows(sql: str, params: tuple = ()) -> list[dict]:
    with get_connection() as conn:
        return [dict(r) for r in conn.execute(sql, params).fetchall()]


@st.cache_data(ttl=10)
def list_materials() -> list[dict]:
    return _rows(
        "SELECT id, title, mastery_level, total_appearances, last_appeared_at, "
        "       started_at, ended_at, created_at "
        "  FROM materials "
        " ORDER BY (last_appeared_at IS NULL), last_appeared_at DESC, created_at DESC"
    )


@st.cache_data(ttl=10)
def get_material(material_id: int) -> dict | None:
    rows = _rows("SELECT * FROM materials WHERE id = ?", (material_id,))
    return rows[0] if rows else None


@st.cache_data(ttl=10)
def list_vocab(material_id: int) -> list[dict]:
    return _rows(
        "SELECT id, term, meaning, type, mastery_level, total_appearances, last_appeared_at "
        "  FROM vocabulary_items "
        " WHERE material_id = ? "
        " ORDER BY type, mastery_level, term",
        (material_id,),
    )


@st.cache_data(ttl=10)
def list_sessions(material_id: int) -> list[dict]:
    return _rows(
        "SELECT id, phase, started_at, ended_at, "
        "       (julianday(COALESCE(ended_at, CURRENT_TIMESTAMP)) - julianday(started_at)) * 86400 AS duration_seconds "
        "  FROM sessions "
        " WHERE material_id = ? "
        " ORDER BY started_at DESC",
        (material_id,),
    )


@st.cache_data(ttl=10)
def list_questions(material_id: int, only_wrong: bool = False) -> list[dict]:
    sql = (
        "SELECT id, session_id, vocabulary_item_id, phase, "
        "       question_text, correct_answer, user_answer, is_correct, feedback, asked_at "
        "  FROM questions "
        " WHERE material_id = ?"
    )
    if only_wrong:
        sql += " AND is_correct = 0"
    sql += " ORDER BY asked_at DESC"
    return _rows(sql, (material_id,))


@st.cache_data(ttl=10)
def overall_stats() -> dict:
    with get_connection() as conn:
        total_sessions = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
        total_seconds = conn.execute(
            "SELECT COALESCE(SUM((julianday(ended_at) - julianday(started_at)) * 86400), 0) "
            "  FROM sessions WHERE ended_at IS NOT NULL"
        ).fetchone()[0]
        unique_vocab = conn.execute(
            "SELECT COUNT(*) FROM vocabulary_items WHERE total_appearances > 0"
        ).fetchone()[0]
        materials_active = conn.execute(
            "SELECT COUNT(*) FROM materials WHERE mastery_level < 3"
        ).fetchone()[0]
        materials_done = conn.execute(
            "SELECT COUNT(*) FROM materials WHERE mastery_level = 3"
        ).fetchone()[0]
        questions_asked = conn.execute("SELECT COUNT(*) FROM questions").fetchone()[0]
        questions_correct = conn.execute(
            "SELECT COUNT(*) FROM questions WHERE is_correct = 1"
        ).fetchone()[0]
    return {
        "total_sessions": total_sessions,
        "total_minutes": round(total_seconds / 60, 1),
        "unique_vocab": unique_vocab,
        "materials_active": materials_active,
        "materials_done": materials_done,
        "questions_asked": questions_asked,
        "questions_correct": questions_correct,
        "accuracy_pct": round(100 * questions_correct / questions_asked, 1) if questions_asked else None,
    }


@st.cache_data(ttl=10)
def mastery_distribution(scope: str) -> list[dict]:
    """scope = 'materials' or 'vocabulary_items'"""
    table = "materials" if scope == "materials" else "vocabulary_items"
    return _rows(
        f"SELECT mastery_level, COUNT(*) AS n FROM {table} GROUP BY mastery_level ORDER BY mastery_level"
    )


@st.cache_data(ttl=10)
def daily_activity(days: int = 14) -> list[dict]:
    return _rows(
        "SELECT DATE(started_at) AS day, COUNT(*) AS sessions, "
        "       COALESCE(SUM((julianday(ended_at) - julianday(started_at)) * 86400), 0) / 60.0 AS minutes "
        "  FROM sessions "
        " WHERE started_at >= DATE('now', ?) "
        " GROUP BY day ORDER BY day",
        (f"-{days} days",),
    )
