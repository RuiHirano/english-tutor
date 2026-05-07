import { call } from '@/lib/api';
import { buildVocabQueue } from '@/lib/vocabQuestions';
import type { PhaseQuestion } from '@/store/sessionStore';
import type { CefrLevel, VocabMistake } from '@shared/types';

const VOCAB_QUEUE_SIZE = 8;

export async function buildVocabPhaseQueue(materialId: number): Promise<PhaseQuestion[]> {
  const [items, material] = await Promise.all([
    call('db:vocab.due', { materialId, limit: VOCAB_QUEUE_SIZE }),
    call('db:material.get', { id: materialId }),
  ]);
  return buildVocabQueue(items, material?.script);
}

export async function buildListeningPhaseQueue(
  materialId: number,
  level: CefrLevel,
): Promise<PhaseQuestion[]> {
  const material = await call('db:material.get', { id: materialId });
  if (!material) throw new Error('Material not found');
  const quiz = await call('claude:generateListeningQuiz', { script: material.script, level });
  return quiz.map((q) => ({
    kind: q.kind === 'mc' ? 'listening.mc' : 'listening.tf',
    prompt: q.question,
    correct: q.answer,
    options: q.kind === 'mc' ? q.options : ['True', 'False'],
    meta: { audio: material.script },
  }));
}

export async function buildReviewPhaseQueue(): Promise<PhaseQuestion[]> {
  const mistakes = await call('db:vocab.mistakes', { limit: 8 });
  return mistakes.map((m) => ({
    kind: 'vocab.jp2en' as const,
    vocabularyItemId: m.id,
    prompt: m.meaning ?? `${m.term} の意味`,
    correct: m.term,
  }));
}

export async function buildSpeakingPhaseQueue(
  materialId: number,
  level: CefrLevel,
): Promise<PhaseQuestion[]> {
  const material = await call('db:material.get', { id: materialId });
  if (!material) throw new Error('Material not found');
  const due = await call('db:vocab.due', { materialId, limit: 8 });
  const terms = due
    .filter((d) => d.term && d.meaning)
    .slice(0, 6)
    .map((d) => ({ term: d.term, meaning: d.meaning, type: d.type }));
  const drills = await call('claude:generateSpeakingDrills', {
    script: material.script,
    terms,
    level,
  });

  const queue: PhaseQuestion[] = [];
  for (const d of drills.jp_to_en) {
    const matched = due.find((v) => v.term === d.term);
    queue.push({
      kind: 'speaking.jp2en',
      vocab: matched ?? undefined,
      prompt: d.japanese,
      correct: d.english,
      meta: { audio: d.english, targetTerms: [d.term], subKind: 'jp2en' },
    });
  }
  for (const r of drills.read_aloud) {
    queue.push({
      kind: 'speaking.read',
      prompt: r.sentence,
      correct: r.sentence,
      meta: { audio: r.sentence, subKind: 'read' },
    });
  }
  return queue;
}

export async function buildRetentionPhaseQueue(): Promise<{
  queue: PhaseQuestion[];
  mistakes: VocabMistake[];
}> {
  const mistakes = await call('db:vocab.mistakes', { limit: 5 });
  const queue: PhaseQuestion[] = mistakes.map((m) => ({
    kind: 'retention.free' as const,
    vocabularyItemId: m.id,
    prompt: `「${m.term}」を使って自分の経験を話してください。`,
    correct: m.term,
    meta: { requiredExpressions: [m.term] },
  }));
  return { queue, mistakes };
}

export async function buildDictationPhaseQueue(
  materialId: number,
  level: CefrLevel,
): Promise<PhaseQuestion[]> {
  const material = await call('db:material.get', { id: materialId });
  if (!material) throw new Error('Material not found');
  const items = await call('claude:generateDictationItems', {
    script: material.script,
    level,
  });
  return items.map((it) => {
    const correct = it.kind === 'full' ? it.sentence : it.blanks.join(' ');
    const kind =
      it.kind === 'partial'
        ? 'dictation.partial'
        : it.kind === 'functional'
          ? 'dictation.functional'
          : 'dictation.full';
    return {
      kind,
      prompt: it.prompt,
      correct,
      meta: { audio: it.sentence },
    } as PhaseQuestion;
  });
}
