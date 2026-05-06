---
name: phase-speaking
description: 工程6 (J→E pattern practice + read-aloud reproduction) and 工程7 (retention test, one expression at a time).
---

# phase-speaking (工程6・7)

## Sub-phases

### 6a. 日→英 即答 (pattern practice)

1. Pick 6–10 vocabulary_items via `python -m english_tutor.flow.due --type expression --limit 6` (and `--type vocab --limit 4`).
2. For each, give a short Japanese sentence the user must render in English using the target term. Speak the Japanese aloud or just show it.
3. Wait for the spoken/written answer. Grade: target structure used? meaning conveyed? Allow paraphrase.
4. Feedback in Japanese with the canonical answer.
5. Record with `phase: "speaking"`, `vocabulary_item_id` set.

### 6b. 音読＋暗唱 (reproduction)

1. Pick 2–3 sentences from the core material's `script`.
2. Show the sentence; have the user read it aloud once.
3. Hide it; ask them to reproduce from memory.
4. Grade for accuracy + naturalness. Record with `phase: "speaking"`. If a specific term within the sentence broke down, link via `vocabulary_item_id`.

### 7. リテンションテスト

For each unresolved mistake item from `python -m english_tutor.flow.mistakes --limit 5`:

1. Give a topic in Japanese: "「<term>」を使って自分の経験を話して".
2. Wait for the user's free speech.
3. Judge: did they actually use the term naturally? Did the meaning come across?
4. If they used it correctly, record `is_correct: 1` with feedback. This is the recovery signal.
5. If not, gently model a correct usage and record `is_correct: 0`.

## Recording shape (all sub-phases)

```
echo '{
  "session_id": <S>, "material_id": <M>,
  "vocabulary_item_id": <V>, "phase": "speaking",
  "question_text": "...", "correct_answer": "...",
  "user_answer": "...", "is_correct": 0|1,
  "feedback": "..."
}' | python -m english_tutor.flow.record
```
