---
name: phase-listening
description: Listen 2–3 times to the core material for global comprehension, then answer 4-choice / true-false comprehension questions. Also drives extensive listening on other materials.
---

# phase-listening (工程3)

## Modes

- **Core listening**: open with `phase = listening` for the active core material.
- **Extensive listening**: open with `phase = extensive_listening` for older / extensive materials, no questions needed.

## Steps — core listening

1. Read the script silently (don't show it to the user yet).
2. Play the audio with `python -m english_tutor.audio.tts --file <path>` or by piping the script. Repeat 2–3 times unless the user says they're ready.
3. After listening, generate 3–5 comprehension questions:
   - 4択：登場人物・出来事・主旨など
   - True/False：細部
4. Show & speak each question. Wait for an answer. Grade. Give feedback.
5. Record each Q&A via `flow.record` with `phase: "listening"`. These need not link to a `vocabulary_item_id`.

## Steps — extensive listening

1. Pick 1–2 older materials (mastery_level ≥ 1, last_appeared_at > 2 weeks ago). Or any unstudied extensive material.
2. Play the audio once. Encourage the user to relax and just absorb.
3. Open and close a session with `phase = extensive_listening`. No questions.
