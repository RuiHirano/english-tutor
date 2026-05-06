---
name: material-new
description: 新しいコア教材を生成する。未解決のミス表現を織り込み、DB に保存する。
---

# material-new

「active な教材がない」とフローコントローラが判断したとき、またはユーザーが新しいトピックを希望したときに使う。

## 参照する入力

- `python -m english_tutor.flow.profile get` → goal / level / interests
- `python -m english_tutor.flow.mistakes --limit 15` → 織り込むべき vocabulary_items

## 手順

1. **コア教材を生成**する。150〜250語程度（レベルに応じて：A1≈80、B1≈150、C1≈250）。テーマはユーザーの interests と goal を反映。**`flow.mistakes` で取得した term をすべて自然に script に埋め込む**こと。次の JSON を作成する：
   - `title`：短い英語タイトル
   - `script`：本文全体（連続したプロースか短い対話）
   - `items`：8〜15 個のエントリ。各エントリは：
     - `term`（script に出てくるそのままの形：単語／句／文法パターン）
     - `meaning`（日本語訳・説明）
     - `type`（`vocab` / `grammar` / `expression`）
2. JSON を `python -m english_tutor.flow.material create` に stdin で渡して保存する。
3. 日本語で、新しいコア教材のタイトルとこれから何をするかを簡潔にユーザーに伝える。

## 品質チェック

- script は自然な英語であること。語彙を不自然に詰め込まない
- すべての `items[].term` が script 内に literal で（大文字小文字を無視して）登場すること
- 既存教材との重複を避ける：`sqlite3 data/learning.db -json "SELECT title FROM materials ORDER BY id DESC LIMIT 10"` で直近のタイトルを確認する
