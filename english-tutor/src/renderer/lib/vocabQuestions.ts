import type { QuestionKind, VocabDue } from '@shared/types';
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

export function buildVocabQueue(items: VocabDue[]): PhaseQuestion[] {
  const usable = items.filter((i) => i.term && i.meaning);
  return usable.map((item) => {
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
      };
    }
    if (kind === 'vocab.fill') {
      return {
        kind,
        vocab: item,
        prompt: `次の意味になる英語を入力してください: 「${item.meaning}」`,
        correct: item.term,
      };
    }
    return {
      kind: 'vocab.jp2en',
      vocab: item,
      prompt: item.meaning ?? '',
      correct: item.term,
    };
  });
}
