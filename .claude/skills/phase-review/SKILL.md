---
name: phase-review
description: Day 3 復習 — 間違えたものの再テスト、精聴の弱点箇所のみ再聴、シャドーイング 2〜3 回。
---

# phase-review（Day 3 復習）

## 手順

1. **語彙・表現の再テスト**（過去に間違えたものを中心に）：
   - `python -m english_tutor.flow.mistakes --limit 8`
   - 各項目について、**前回失敗した形式とは違う形式** で出題する。例：前回 J→E で失敗していたら今回は穴埋めで
   - 結果を `flow.record` に記録。ここで正解できたら recovery シグナル。パターンを満たしていれば `flow.mastery vocab` で昇格
2. **精聴の弱点箇所のみ再聴**：
   - この教材の直近の dictation セッション ID を取得：
     `sqlite3 data/learning.db -json "SELECT id FROM sessions WHERE material_id=<M> AND phase='dictation' ORDER BY started_at DESC LIMIT 1"`
   - そのセッションで間違えた問題を取得：
     `sqlite3 data/learning.db -json "SELECT question_text, correct_answer FROM questions WHERE session_id=<S> AND is_correct=0"`
   - 各文について：音声を再生し、ユーザーに 1 回だけ書き取らせて採点
3. **シャドーイング 2〜3 回**（コア教材）

ステップ 1 と 2 では session の `phase = review` で開く（`flow.record` の `phase` も `review`）。ステップ 3 はシャドーイングの流れを使い回すが、session の phase は `review` のままにしてダッシュボードで一括して見える形にする。
