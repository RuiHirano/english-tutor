from __future__ import annotations

import pandas as pd
import streamlit as st

from dashboard import db


MASTERY_LABELS = {0: "0 未学習", 1: "1 認識", 2: "2 使用", 3: "3 自動化"}


def render(material_id: int) -> None:
    material = db.get_material(material_id)
    if material is None:
        st.error(f"Material {material_id} not found.")
        return

    st.title(material["title"])

    cols = st.columns(4)
    cols[0].caption("習熟度")
    cols[0].write(MASTERY_LABELS[material["mastery_level"]])
    cols[1].caption("学習回数")
    cols[1].write(str(material["total_appearances"]))
    cols[2].caption("最終学習")
    cols[2].write(_fmt_dt(material["last_appeared_at"]))
    cols[3].caption("作成")
    cols[3].write(_fmt_dt(material["created_at"]))

    if material["started_at"]:
        st.caption(f"学習開始: {material['started_at']}　学習完了: {material['ended_at'] or '—'}")

    with st.expander("Script", expanded=False):
        st.markdown(f"```\n{material['script']}\n```")

    st.divider()
    _render_vocab(material_id)

    st.divider()
    _render_sessions(material_id)

    st.divider()
    _render_questions(material_id)


def _render_vocab(material_id: int) -> None:
    st.subheader("Vocabulary Items")
    vocab = db.list_vocab(material_id)
    if not vocab:
        st.caption("抽出された項目はありません。")
        return

    types = sorted({v["type"] or "vocab" for v in vocab})
    tabs = st.tabs([f"{t}（{sum(1 for v in vocab if (v['type'] or 'vocab') == t)}）" for t in types])
    for tab, t in zip(tabs, types):
        with tab:
            df = pd.DataFrame([v for v in vocab if (v["type"] or "vocab") == t])
            df["習熟度"] = df["mastery_level"].map(MASTERY_LABELS)
            df = df[["term", "meaning", "習熟度", "total_appearances", "last_appeared_at"]]
            df.columns = ["term", "意味", "習熟度", "出現", "最終出現"]
            st.dataframe(df, hide_index=True, use_container_width=True)


def _render_sessions(material_id: int) -> None:
    st.subheader("学習履歴")
    sessions = db.list_sessions(material_id)
    if not sessions:
        st.caption("学習記録なし。")
        return
    df = pd.DataFrame(sessions)
    df["所要"] = df["duration_seconds"].apply(lambda s: f"{s/60:.1f} 分" if s and s > 0 else "—")
    df = df[["id", "phase", "started_at", "ended_at", "所要"]]
    df.columns = ["#", "phase", "開始", "終了", "所要"]
    st.dataframe(df, hide_index=True, use_container_width=True)


def _render_questions(material_id: int) -> None:
    st.subheader("Q&A 履歴")
    only_wrong = st.toggle("間違えた問題のみ", value=False, key=f"only_wrong_{material_id}")
    questions = db.list_questions(material_id, only_wrong=only_wrong)
    if not questions:
        st.caption("該当する Q&A はありません。")
        return
    df = pd.DataFrame(questions)
    df["正誤"] = df["is_correct"].map({1: "✓", 0: "✗"})
    df = df[["asked_at", "phase", "正誤", "question_text", "correct_answer", "user_answer", "feedback"]]
    df.columns = ["時刻", "phase", "正誤", "出題", "正解", "回答", "コメント"]
    st.dataframe(df, hide_index=True, use_container_width=True)


def _fmt_dt(value: str | None) -> str:
    if not value:
        return "—"
    return value[:10]
