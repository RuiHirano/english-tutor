---
name: phase-listening
description: 工程3 — 多聴。コア素材で全体把握 → 内容把握問題。別素材・過去素材の多聴も実施。
---

# phase-listening（工程3）

## モード

- **コア多聴**：active なコア素材に対して `phase = listening` で session を開く
- **extensive 多聴**：別素材／過去素材に対して `phase = extensive_listening` で session を開く（問題なし）

## コア多聴の手順

1. script はまだユーザーに見せない
2. `python -m english_tutor.audio.tts --file <path>` または stdin で script を読み上げる。2〜3 回繰り返す（ユーザーが「もう大丈夫」と言うまで）
3. 聴き終わったら、内容把握問題を 3〜5 問生成する：
   - 4択：登場人物・出来事・主旨など
   - True/False：細部
4. 各問題を読み上げ＆表示し、ユーザーの回答を待つ。採点してフィードバック
5. 各 Q&A を `flow.record` で記録（`phase: "listening"`）。`vocabulary_item_id` は不要（NULL でよい）

## extensive 多聴の手順

1. 古い素材（`mastery_level >= 1` かつ `last_appeared_at` が 2 週間以上前）または未学習の extensive 素材から 1〜2 本選ぶ
2. 1 回読み上げる。リラックスして浴びるよう促す
3. session を `phase = extensive_listening` で開いて閉じるだけ。問題は出さない
