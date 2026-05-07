import type { ExampleSentence, QuestionKind, VocabDue } from '@shared/types';
import type { PhaseQuestion } from '@/store/sessionStore';

const KINDS: QuestionKind[] = ['vocab.mc', 'vocab.fill', 'vocab.jp2en'];

function pickKindFor(item: VocabDue): QuestionKind {
  // 新規は意味選択 → 慣れたら fill / jp→en へ。
  const idx = Math.min(item.mastery_level, KINDS.length - 1);
  if (item.mastery_level === 0) return 'vocab.mc';
  if (item.mastery_level === 1) return 'vocab.fill';
  return KINDS[idx] ?? 'vocab.jp2en';
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function splitSentences(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?。！？])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function findMaterialExample(
  script: string | undefined,
  scriptJa: string | undefined,
  term: string,
): ExampleSentence | null {
  const en = splitSentences(script);
  const ja = splitSentences(scriptJa);
  if (en.length === 0 || !term) return null;
  const cleaned = term.replace(/[+~()]/g, '').trim();
  const probe = (cleaned.length > 2 ? cleaned : term).toLowerCase();
  const idx = en.findIndex((s) => s.toLowerCase().includes(probe));
  if (idx < 0) return null;
  return {
    en: en[idx],
    // 英語と日本語の文数が一致する前提（プロンプトで指示済み）。ずれたら ja は空。
    ja: ja.length === en.length ? ja[idx] : '',
  };
}

function buildExamples(
  item: VocabDue,
  script: string | undefined,
  scriptJa: string | undefined,
): ExampleSentence[] {
  const out: ExampleSentence[] = [];
  const fromMaterial = findMaterialExample(script, scriptJa, item.term);
  if (fromMaterial) out.push(fromMaterial);
  for (const e of item.examples ?? []) {
    out.push(e);
    if (out.length >= 3) break;
  }
  return out;
}

export function buildVocabQueue(items: VocabDue[], script?: string, scriptJa?: string): PhaseQuestion[] {
  const usable = items.filter((i) => i.term && i.meaning);
  return usable.map((item) => {
    const examples = buildExamples(item, script, scriptJa);
    const kind = pickKindFor(item);
    if (kind === 'vocab.mc') {
      const distractors = shuffle(usable.filter((x) => x.id !== item.id))
        .slice(0, 3)
        .map((x) => x.meaning ?? '');
      const options = shuffle([item.meaning ?? '', ...distractors]).filter(Boolean);
      return {
        kind,
        vocab: item,
        prompt: `「${item.term}」の意味として最も近いものは？`,
        correct: item.meaning ?? '',
        options,
        examples,
      };
    }
    if (kind === 'vocab.fill') {
      return {
        kind,
        vocab: item,
        prompt: `次の意味になる英語を入力してください: 「${item.meaning}」`,
        correct: item.term,
        examples,
      };
    }
    return {
      kind: 'vocab.jp2en',
      vocab: item,
      prompt: item.meaning ?? '',
      correct: item.term,
      examples,
    };
  });
}
