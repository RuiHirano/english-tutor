---
name: start
description: Entry point. Read DB state, decide today's menu, and run phases sequentially.
---

# /start

Triggered when the user types `/start`. Drive the entire learning session from this skill.

## Steps

1. Run `python -m english_tutor.db.connection` once if `data/learning.db` doesn't exist yet (idempotent).
2. Run `python -m english_tutor.flow.profile get`. If it returns `null`, ask the user (in Japanese) for:
   - 学習目的（ビジネス／日常会話／旅行 など、自由記述可）
   - 現在のレベル（CEFR: A1〜C2、わからなければ目安を質問しながら推定）
   - 興味分野（カンマ区切りで複数）
   Then send the JSON to `python -m english_tutor.flow.profile set` via stdin.
3. Run `python -m english_tutor.flow.state` and parse the JSON.
4. Decide today's menu using **Day inference** (see flow-controller prompt). State the plan to the user in 1–2 lines.
5. For each chosen phase:
   1. `python -m english_tutor.flow.session open --material-id M --phase P` → capture `session_id`.
   2. Load and follow the corresponding `.kiro/skills/phase-<name>/SKILL.md`.
   3. After the phase, `python -m english_tutor.flow.session close --session-id S`.
6. After all phases:
   - Reflect on which `vocabulary_items` and `materials` deserve a `mastery_level` bump and apply via `flow.mastery`.
   - Summarize today's accomplishments in Japanese, encourage continuation tomorrow.

## Notes

- Always close any open session before exiting, even on early termination.
- If the user wants to stop mid-session, summarize progress so far and close the open session.
