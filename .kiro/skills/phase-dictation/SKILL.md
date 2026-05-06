---
name: phase-dictation
description: Detail-listening dictation drills — partial, function-word, and full transcription.
---

# phase-dictation (工程4)

## Steps

1. Choose 4–6 sentences from the core material's `script`. Mix:
   - **partial_dictation**: blank 1–2 content words in the sentence, ask the user to fill them in.
   - **function_word**: blank only function words (a/the/of/to/in/on/and/etc.).
   - **full_dictation**: ask the user to transcribe a sentence verbatim.
2. For each sentence:
   1. Speak the sentence with `python -m english_tutor.audio.tts "..."`. Repeat once on request.
   2. Show the prompt with blanks (or empty for full dictation).
   3. Grade per dictation rules: ignore case, leading/trailing whitespace, trailing punctuation; otherwise exact.
3. Feedback in Japanese: which words were missed, why (弱形だったか、語尾が落ちたか、知らない語だったか).
4. Record each Q&A via `flow.record` with `phase: "dictation"`. If the missed word maps to a `vocabulary_items` row, set `vocabulary_item_id`.

## Tips

- Function-word dictation surfaces weak forms (e.g., "of" → /əv/). Call those out by name.
- After three sentences from the new material, sneak in 1–2 from older materials (review).
