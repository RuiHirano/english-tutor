---
name: phase-vocab
description: Vocab / grammar / expression intake. Pick the most-due items and generate fresh questions in 4-choice, fill-blank, or J→E form.
---

# phase-vocab (工程2)

## Inputs

- `material_id`, `session_id` (passed by /start)
- Up to ~25% of items should come from older materials (review). The `flow.due` query handles this automatically — just don't filter by `--material-id`.

## Steps

1. Pull candidates: `python -m english_tutor.flow.due --type vocab --limit 6` (and again with `--type grammar` and `--type expression`, smaller limits).
2. For each item, choose a fresh question form:
   - **4択 (multiple_choice)**: meaning question with 3 plausible distractors.
   - **穴埋め (fill_blank)**: a sentence using the term with the term blanked out.
   - **日→英 (ja_to_en)**: a Japanese sentence the user must render using the term.
   Vary forms so the user doesn't see the same shape twice in a row.
3. Speak the prompt aloud when it's English, using `python -m english_tutor.audio.tts "..."`. Show it in chat too.
4. Wait for the user's answer. Grade per the rules in the flow-controller prompt.
5. Give brief feedback in Japanese (1–2 lines: 正解 / 部分点 / 解説 + 模範解答).
6. Record:
   ```
   echo '{
     "session_id": <S>, "material_id": <M>,
     "vocabulary_item_id": <V>, "phase": "vocab",
     "question_text": "...", "correct_answer": "...",
     "user_answer": "...", "is_correct": 0|1,
     "feedback": "..."
   }' | python -m english_tutor.flow.record
   ```
7. After ~8–12 items (or 10 minutes of effort, whichever first), close the phase.

## Tips

- Mix new and review. New items first while attention is fresh.
- If the user fails twice in a row on the same item, switch to recognition (4択) before retesting production (J→E).
