from __future__ import annotations

import pandas as pd
import streamlit as st

from dashboard import db


MASTERY_LABELS = {0: "0 未学習", 1: "1 認識", 2: "2 使用", 3: "3 自動化"}


def render() -> None:
    st.title("学んだ単語")

    vocab = db.list_learned_vocab()
    if not vocab:
        st.info("まだ学習済みの単語がありません。学習を始めると、ここに表示されます。")
        return

    types = sorted({v["type"] or "vocab" for v in vocab})
    mastery_levels = sorted({v["mastery_level"] for v in vocab})

    cols = st.columns(2)
    type_filter = cols[0].multiselect("タイプ", types, default=types)
    mastery_filter = cols[1].multiselect(
        "習熟度",
        mastery_levels,
        default=mastery_levels,
        format_func=lambda lv: MASTERY_LABELS.get(lv, str(lv)),
    )
    keyword = st.text_input("検索（term / 意味）", value="")

    filtered = [
        v for v in vocab
        if (v["type"] or "vocab") in type_filter
        and v["mastery_level"] in mastery_filter
        and (
            not keyword
            or keyword.lower() in (v["term"] or "").lower()
            or keyword.lower() in (v["meaning"] or "").lower()
        )
    ]

    st.caption(f"{len(filtered)} 件 / 全 {len(vocab)} 件")

    if not filtered:
        st.info("条件に一致する単語がありません。")
        return

    df = pd.DataFrame(filtered)
    df["習熟度"] = df["mastery_level"].map(MASTERY_LABELS)
    df["タイプ"] = df["type"].fillna("vocab")
    df = df[[
        "term", "meaning", "タイプ", "習熟度",
        "total_appearances", "last_appeared_at", "material_title",
    ]]
    df.columns = ["term", "意味", "タイプ", "習熟度", "出現", "最終出現", "教材"]
    st.dataframe(df, hide_index=True, use_container_width=True)
