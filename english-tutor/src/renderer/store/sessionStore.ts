import { create } from 'zustand';
import type { Evaluation, PhaseName, QuestionKind, VocabDue } from '@shared/types';
import { call } from '@/lib/api';

export interface PhaseQuestion {
  kind: QuestionKind;
  vocab?: VocabDue;
  vocabularyItemId?: number | null;
  prompt: string;
  correct: string;
  options?: string[];
  meta?: Record<string, unknown>;
}

export interface AnswerRecord {
  question: PhaseQuestion;
  userAnswer: string;
  isCorrect: boolean;
  feedback?: string;
  modelAnswer?: string;
}

interface SessionState {
  sessionId: number | null;
  materialId: number | null;
  phase: PhaseName | null;
  queue: PhaseQuestion[];
  cursor: number;
  history: AnswerRecord[];
  busy: boolean;

  start: (materialId: number, phase: PhaseName, queue: PhaseQuestion[]) => Promise<void>;
  answer: (userAnswer: string) => Promise<AnswerRecord>;
  finish: () => Promise<void>;
  abandon: () => Promise<void>;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: null,
  materialId: null,
  phase: null,
  queue: [],
  cursor: 0,
  history: [],
  busy: false,

  reset: () =>
    set({
      sessionId: null,
      materialId: null,
      phase: null,
      queue: [],
      cursor: 0,
      history: [],
      busy: false,
    }),

  start: async (materialId, phase, queue) => {
    const { sessionId } = await call('db:session.open', { materialId, phase });
    set({ sessionId, materialId, phase, queue, cursor: 0, history: [] });
  },

  answer: async (userAnswer) => {
    const state = get();
    const q = state.queue[state.cursor];
    if (!q || state.sessionId === null || state.materialId === null || state.phase === null) {
      throw new Error('No active question');
    }
    set({ busy: true });
    try {
      const grade = await call('eval:grade', {
        kind: q.kind,
        correct: q.correct,
        user: userAnswer,
        meta: q.options ? { options: q.options } : undefined,
      });

      let isCorrect = grade.isCorrect;
      let feedback = grade.feedback;
      let modelAnswer: string | undefined;

      if (grade.requiresAI) {
        const aiResult = await runAiEvaluation(q, userAnswer);
        if (aiResult) {
          isCorrect = aiResult.isCorrect;
          feedback = aiResult.feedback;
          modelAnswer = aiResult.modelAnswer;
        }
      }

      const vocabularyItemId = q.vocabularyItemId ?? q.vocab?.id ?? null;
      await call('db:question.record', {
        sessionId: state.sessionId,
        materialId: state.materialId,
        vocabularyItemId,
        phase: state.phase,
        questionText: q.prompt,
        correctAnswer: q.correct,
        userAnswer,
        isCorrect,
        feedback: feedback ?? null,
      });

      const record: AnswerRecord = {
        question: q,
        userAnswer,
        isCorrect,
        feedback,
        modelAnswer,
      };
      set((s) => ({
        history: [...s.history, record],
        cursor: s.cursor + 1,
        busy: false,
      }));
      return record;
    } catch (err) {
      set({ busy: false });
      throw err;
    }
  },

  finish: async () => {
    const { sessionId } = get();
    if (sessionId !== null) {
      await call('db:session.close', { sessionId });
    }
    set({ sessionId: null });
  },

  abandon: async () => {
    const { sessionId, history } = get();
    // 何問か既に答えていれば「進んだ」とみなしてセッションを正規に閉じる。
    // 1 問も答えていない場合はセッションを閉じない（次回再開）。
    if (sessionId !== null && history.length > 0) {
      try {
        await call('db:session.close', { sessionId });
      } catch {
        /* ignore */
      }
    }
    set({ sessionId: null });
  },
}));

async function runAiEvaluation(
  q: PhaseQuestion,
  userAnswer: string,
): Promise<Evaluation | null> {
  const meta = (q.meta ?? {}) as { targetTerms?: string[]; requiredExpressions?: string[] };
  switch (q.kind) {
    case 'vocab.jp2en':
      return call('claude:evaluateJp2En', {
        japanese: q.prompt,
        modelAnswer: q.correct,
        userAnswer,
      });
    case 'speaking.jp2en':
    case 'speaking.read':
      return call('claude:evaluateSpeaking', {
        prompt: q.prompt,
        targetExpressions: meta.targetTerms ?? [q.correct],
        userTranscript: userAnswer,
      });
    case 'retention.free':
      return call('claude:evaluateRetention', {
        requiredExpressions: meta.requiredExpressions ?? [q.correct],
        userTranscript: userAnswer,
      });
    default:
      return null;
  }
}
