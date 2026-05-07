import { z } from 'zod';
import type { Evaluation, MaterialDraft } from '@shared/types';
import { runClaudeJson } from './runner';
import promptJp2En from './prompts/eval-jp2en.md?raw';
import promptSpeaking from './prompts/eval-speaking.md?raw';
import promptRetention from './prompts/eval-retention.md?raw';
import promptMaterialNew from './prompts/material-new.md?raw';
import promptQuizListening from './prompts/quiz-listening.md?raw';
import promptQuizDictation from './prompts/quiz-dictation.md?raw';
import promptQuizSpeaking from './prompts/quiz-speaking.md?raw';
import type { DictationItem, ListeningQuizItem, SpeakingDrills } from '@shared/ipc';

function render(template: string, payload: unknown): string {
  return template.replace('{{json}}', JSON.stringify(payload, null, 2));
}

const EvalSchema = z.object({
  isCorrect: z.boolean(),
  score: z.number().min(0).max(1).optional(),
  feedback: z.string(),
  modelAnswer: z.string().optional(),
});

export async function evaluateJp2En(input: {
  japanese: string;
  modelAnswer: string;
  userAnswer: string;
}): Promise<Evaluation> {
  const raw = await runClaudeJson(render(promptJp2En, input), { timeoutMs: 30_000 });
  return EvalSchema.parse(raw);
}

export async function evaluateSpeaking(input: {
  prompt: string;
  targetExpressions: string[];
  userTranscript: string;
}): Promise<Evaluation> {
  const raw = await runClaudeJson(render(promptSpeaking, input), { timeoutMs: 30_000 });
  return EvalSchema.parse(raw);
}

export async function evaluateRetention(input: {
  requiredExpressions: string[];
  userTranscript: string;
}): Promise<Evaluation> {
  const raw = await runClaudeJson(render(promptRetention, input), { timeoutMs: 30_000 });
  return EvalSchema.parse(raw);
}

const MaterialDraftSchema = z.object({
  title: z.string(),
  script: z.string(),
  script_ja: z.string(),
  items: z
    .array(
      z.object({
        term: z.string(),
        meaning: z.string(),
        type: z.enum(['vocab', 'grammar', 'expression']),
        examples: z
          .array(z.object({ en: z.string(), ja: z.string() }))
          .min(1)
          .max(3)
          .optional(),
      }),
    )
    .min(1),
});

export async function generateMaterial(input: {
  profile: unknown;
  mistakes: unknown;
  constraints?: string;
}): Promise<MaterialDraft> {
  const raw = await runClaudeJson(render(promptMaterialNew, input), { timeoutMs: 90_000 });
  return MaterialDraftSchema.parse(raw);
}

const ListeningQuizSchema = z.object({
  items: z
    .array(
      z.discriminatedUnion('kind', [
        z.object({
          kind: z.literal('mc'),
          question: z.string(),
          options: z.array(z.string()).min(2),
          answer: z.string(),
        }),
        z.object({
          kind: z.literal('tf'),
          question: z.string(),
          answer: z.string(),
        }),
      ]),
    )
    .min(1),
});

export async function generateListeningQuiz(input: {
  script: string;
  level: string;
}): Promise<ListeningQuizItem[]> {
  const raw = await runClaudeJson(render(promptQuizListening, input), { timeoutMs: 60_000 });
  const parsed = ListeningQuizSchema.parse(raw);
  return parsed.items.map((it) =>
    it.kind === 'mc'
      ? { kind: 'mc', question: it.question, options: it.options, answer: it.answer }
      : { kind: 'tf', question: it.question, answer: it.answer },
  );
}

const DictationSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(['partial', 'functional', 'full']),
        sentence: z.string(),
        prompt: z.string(),
        blanks: z.array(z.string()).min(1),
      }),
    )
    .min(1),
});

export async function generateDictationItems(input: {
  script: string;
  level: string;
}): Promise<DictationItem[]> {
  const raw = await runClaudeJson(render(promptQuizDictation, input), { timeoutMs: 60_000 });
  return DictationSchema.parse(raw).items;
}

const SpeakingDrillsSchema = z.object({
  jp_to_en: z
    .array(
      z.object({
        japanese: z.string(),
        english: z.string(),
        term: z.string(),
      }),
    )
    .min(1),
  read_aloud: z.array(z.object({ sentence: z.string() })).min(1),
});

export async function generateSpeakingDrills(input: {
  script: string;
  terms: unknown;
  level: string;
}): Promise<SpeakingDrills> {
  const raw = await runClaudeJson(render(promptQuizSpeaking, input), { timeoutMs: 60_000 });
  return SpeakingDrillsSchema.parse(raw);
}
