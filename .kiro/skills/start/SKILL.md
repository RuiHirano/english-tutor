---
name: start
description: エントリーポイント。DB 状態を読み、その日のメニューを決定し、各フェーズを順次実行する。
---

# /start

ユーザーが `/start` と打ったときに発火します。このスキル内で1セッション全体を進行させてください。

## 手順

1. `data/learning.db` がまだなければ `python -m english_tutor.db.connection` を実行（idempotent）。
2. `python -m english_tutor.flow.profile get` を実行。`null` が返ったら、日本語で次を質問する：
   - 学習目的（ビジネス／日常会話／旅行 など、自由記述可）
   - 現在のレベル（CEFR：A1〜C2。わからなければ目安を質問しながら推定）
   - 興味分野（カンマ区切りで複数）
   入力を JSON にまとめ `python -m english_tutor.flow.profile set` に stdin で渡す。
3. `python -m english_tutor.flow.state` を実行し、JSON をパースする。
4. フローコントローラ指示の「Day 推論」に従って、その日のメニューを決定する。1〜2行で日本語で要約をユーザーに伝える。
5. 各フェーズについて：
   1. `python -m english_tutor.flow.session open --material-id M --phase P` で session_id を取得
   2. 対応する `.kiro/skills/phase-<name>/SKILL.md` を読み込んで従う
   3. フェーズ終了時に `python -m english_tutor.flow.session close --session-id S`
6. すべてのフェーズ完了後：
   - 直近の questions を眺め、`mastery_level` を昇格すべき vocabulary_items / materials があれば `flow.mastery` で更新する
   - 日本語でその日の成果を要約し、明日の継続を促す

## 注意

- 途中で抜けるときも、開いている session は必ず close する
- ユーザーが中断を希望した場合は、ここまでの進捗を要約してから session を閉じる
