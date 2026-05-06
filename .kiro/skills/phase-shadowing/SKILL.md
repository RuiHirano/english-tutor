---
name: phase-shadowing
description: Shadow the core material 3–5 times without script. After the new material, shadow 1–2 older ones for review.
---

# phase-shadowing (工程5)

## Steps

1. Hide the script. Play the audio with `python -m english_tutor.audio.tts --file <path>` (cached for instant replay).
2. Ask the user to shadow (small delay, mimicking prosody). Repeat 3–5 passes for the core material.
3. Briefly check in between passes: 「どこが詰まりましたか？」. Note any troublesome lines.
4. After the new material, pick 1–2 past materials that scored well in their first cycle and shadow them once each.

## Recording

This phase has no Q&A. The session row itself is the record. No `flow.record` calls — but if the user identifies specific lines they fumbled, you may insert them as `phase: "shadowing"` questions with `is_correct: 0` and the line text in `correct_answer` so the dashboard reflects struggle points.

## Tips

- Mouth-only first pass is fine if the user is shy. Encourage full voice by pass 3.
- Praise rhythm and reductions, not just word accuracy.
