from __future__ import annotations

import altair as alt
import pandas as pd
import streamlit as st

from dashboard import db


def render() -> None:
    st.title("English Tutor — Home")

    stats = db.overall_stats()

    cols = st.columns(4)
    cols[0].metric("総学習回数", stats["total_sessions"])
    cols[1].metric("累計学習時間", f"{stats['total_minutes']:.0f} 分")
    cols[2].metric("学習中の教材", stats["materials_active"])
    cols[3].metric("完了教材", stats["materials_done"])

    cols = st.columns(3)
    cols[0].metric("カバー語彙数", stats["unique_vocab"])
    cols[1].metric("総出題数", stats["questions_asked"])
    accuracy = stats["accuracy_pct"]
    cols[2].metric("正答率", f"{accuracy:.1f}%" if accuracy is not None else "—")

    st.divider()

    left, right = st.columns(2)

    with left:
        st.subheader("習熟度分布")
        for scope, label in (("vocabulary_items", "語彙"), ("materials", "教材")):
            rows = db.mastery_distribution(scope)
            if not rows:
                st.caption(f"{label}：データなし")
                continue
            df = pd.DataFrame(rows)
            df["mastery_level"] = df["mastery_level"].map(
                {0: "0 未学習", 1: "1 認識", 2: "2 使用", 3: "3 自動化"}
            )
            chart = (
                alt.Chart(df)
                .mark_bar()
                .encode(
                    x=alt.X("mastery_level:N", title=None),
                    y=alt.Y("n:Q", title="件数"),
                    tooltip=["mastery_level", "n"],
                )
                .properties(title=label, height=180)
            )
            st.altair_chart(chart, use_container_width=True)

    with right:
        st.subheader("直近2週間のアクティビティ")
        rows = db.daily_activity(days=14)
        if not rows:
            st.caption("学習履歴なし")
        else:
            df = pd.DataFrame(rows)
            df["day"] = pd.to_datetime(df["day"])
            chart = (
                alt.Chart(df)
                .mark_bar()
                .encode(
                    x=alt.X("day:T", title=None),
                    y=alt.Y("minutes:Q", title="分"),
                    tooltip=["day:T", "sessions:Q", "minutes:Q"],
                )
                .properties(height=220)
            )
            st.altair_chart(chart, use_container_width=True)

    st.divider()

    st.subheader("教材一覧")
    materials = db.list_materials()
    if not materials:
        st.info("まだ教材がありません。Kiro で `/start` してみてください。")
        return
    df = pd.DataFrame(materials)
    df["mastery"] = df["mastery_level"].map(
        {0: "0 未学習", 1: "1 認識", 2: "2 使用", 3: "3 自動化"}
    )
    df = df[["id", "title", "mastery", "total_appearances", "last_appeared_at", "created_at"]]
    df.columns = ["id", "タイトル", "習熟度", "学習回数", "最終学習", "作成"]
    st.dataframe(df, hide_index=True, use_container_width=True)
