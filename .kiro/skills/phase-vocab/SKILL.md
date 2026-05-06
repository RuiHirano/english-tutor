---
name: phase-vocab
description: 工程2 — 語彙・文法・表現のインプット。due_score 上位の項目から 4択 / 穴埋め / 日→英 を都度生成して出題する。
---

# phase-vocab（工程2）

## 入力

- `material_id`、`session_id`（フローコントローラから渡される）
- 復習プールから過去項目を最大 25% 程度混ぜる：`flow.due` を `--material-id` フィルタなしで呼ぶと過去素材の項目も候補に含まれるので、その自然な分布に任せる

## 手順

1. 候補を取得する：
   - `python -m english_tutor.flow.due --type vocab --limit 6`
   - `python -m english_tutor.flow.due --type grammar --limit 3`
   - `python -m english_tutor.flow.due --type expression --limit 3`
2. 各項目について、出題形式を都度選ぶ：
   - **4択（multiple_choice）**：意味を問う。誤答の選択肢は紛らわしいが明らかに不適切なものを 3 つ
   - **穴埋め（fill_blank）**：その term を含む例文の term 部分を空欄にする
   - **日→英（ja_to_en）**：日本語の文をユーザーがその term を使って英訳する
   同じ形式が連続しないように形式を変えてください
3. 英語の prompt は `python -m english_tutor.audio.tts "..."` で読み上げる（チャットにも表示する）
4. ユーザーの回答を待ち、フローコントローラの採点ルールに従って採点する
5. 日本語で簡潔にフィードバック（1〜2行：正解／部分点／解説 + 模範解答）
6. 結果を記録（ヒアドキュメント形式を厳守。`echo` や `python3 -c` は使わない）：
   ```bash
   python3 << 'PYEOF'
   import subprocess, json, sys
   data = {
     "session_id": <S>, "material_id": <M>,
     "vocabulary_item_id": <V>, "phase": "vocab",
     "question_text": "...", "correct_answer": "...",
     "user_answer": "...", "is_correct": 0|1,
     "feedback": "..."
   }
   p = subprocess.run(
       [sys.executable, "-m", "english_tutor.flow.record"],
       input=json.dumps(data), text=True, capture_output=True)
   if p.returncode != 0:
       print(p.stderr)
   else:
       print(p.stdout)
   PYEOF
   ```
7. 8〜12 項目（または約 10 分）でフェーズを終える

## ヒント

- 集中力のあるうちに新規項目を先に。復習項目は後半へ
- 同じ項目で 2 回続けて間違えたら、次は産出（日→英）から認識（4択）に下げて出し直す
