---
name: phase-review
description: Day 3 review — re-test mistakes, replay weak listening lines, shadow 2–3 times.
---

# phase-review

## Steps

1. **語彙・表現の再テスト** (focus on previously-failed items):
   - `python -m english_tutor.flow.mistakes --limit 8`
   - For each, generate a *different* question form than what they last failed on. If they failed on J→E, try fill-blank now.
   - Record results. A correct answer here is the recovery signal; bump that vocabulary_item's `mastery_level` if pattern warrants.
2. **精聴の弱点箇所のみ再聴**:
   - Find the most recent dictation session for this material via:
     `sqlite3 data/learning.db -json "SELECT id FROM sessions WHERE material_id=<M> AND phase='dictation' ORDER BY started_at DESC LIMIT 1"`
   - List its incorrect questions:
     `sqlite3 data/learning.db -json "SELECT question_text, correct_answer FROM questions WHERE session_id=<S> AND is_correct=0"`
   - For each missed sentence: replay audio, give the user one chance, grade.
3. **シャドーイング 2〜3回** of the core material.

Open phase = `review` for steps 1 and 2 (Q&A logged with phase=`review`). Step 3 reuses the shadowing flow but the session phase remains `review` so the dashboard groups it correctly.
