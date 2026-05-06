---
name: material-new
description: Generate a new core material plus a few extensive listening pieces, weave in unresolved mistakes, and persist to DB.
---

# material-new

Triggered when the flow-controller decides "no active material to work on" (or the user asks for a new topic).

## Inputs to consult

- `python -m english_tutor.flow.profile get` → goal / level / interests
- `python -m english_tutor.flow.mistakes --limit 15` → vocabulary_items to weave in

## Steps

1. **Generate a core material**. Aim for ~150–250 words (level-appropriate; A1≈80, B1≈150, C1≈250). Theme should reflect the user's interests and goal. **Naturally embed every mistake `term` from `flow.mistakes` into the script.** Provide:
   - `title`: short English title
   - `script`: the full text (continuous prose or a short dialogue)
   - `items`: 8–15 entries, each:
     - `term` (English word/phrase/grammar pattern as it appears)
     - `meaning` (Japanese gloss)
     - `type` (`vocab` / `grammar` / `expression`)
2. Save it: pipe the JSON to `python -m english_tutor.flow.material`.
3. **Generate 2–3 extensive listening pieces** on related but lighter topics. Same JSON shape, but `items` can be empty (or just 2–3 key vocab). Save each via `flow.material`.
4. Briefly tell the user (in Japanese) the new core material's title and what's coming next.

## Quality checks

- Script must read naturally. Don't shoehorn vocabulary in unnaturally.
- Every `items[].term` must literally appear in `script` (case-insensitive).
- Avoid duplicates against existing materials — quickly scan recent titles via `sqlite3 data/learning.db -json "SELECT title FROM materials ORDER BY id DESC LIMIT 10"`.
