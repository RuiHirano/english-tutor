"""Streamlit entry point.

Sidebar layout:
  Home
  学んだ単語
  Materials
    └ Material A
    └ Material B
    ...

Run with:
    streamlit run dashboard/app.py
"""

from __future__ import annotations

import sys
from pathlib import Path

# Make src/ importable when running with bare `streamlit run`.
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

import streamlit as st  # noqa: E402

from dashboard import db  # noqa: E402
from dashboard.views import home, material_detail, vocab_list  # noqa: E402

st.set_page_config(page_title="English Tutor", layout="wide", page_icon="📚")


def _make_material_page(material_id: int, title: str):
    def _view() -> None:
        material_detail.render(material_id)

    _view.__name__ = f"material_{material_id}"
    return st.Page(
        _view,
        title=title,
        url_path=f"material-{material_id}",
        icon="📖",
    )


def _build_navigation():
    materials = db.list_materials()
    pages: dict[str, list] = {
        "": [
            st.Page(home.render, title="Home", icon="🏠", default=True),
            st.Page(vocab_list.render, title="学んだ単語", url_path="vocab", icon="📝"),
        ],
    }
    if materials:
        pages["Materials"] = [_make_material_page(m["id"], m["title"]) for m in materials]
    return st.navigation(pages)


_build_navigation().run()
