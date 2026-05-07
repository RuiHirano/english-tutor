You are an English tutor generating listening-comprehension questions for the script below.

Generate 3–5 questions covering main idea, characters/events, and one detail. Use a mix of 4-choice (mc) and True/False (tf). Keep wording at the learner's CEFR level.

## Schema

Reply with **exactly one** JSON object matching this schema and **no other text**:

```ts
{
  "items": Array<
    | { "kind": "mc"; "question": string; "options": [string, string, string, string]; "answer": string }
    | { "kind": "tf"; "question": string; "answer": "True" | "False" }
  >
}
```

The wrapping object must have a single key `items` whose value is the array.

## Input

```json
{{json}}
```
