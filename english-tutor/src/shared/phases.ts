import type { PhaseName, QuestionKind } from './types';

export const PHASES: PhaseName[] = [
  'vocab',
  'listening',
  'dictation',
  'shadowing',
  'speaking',
  'retention',
  'review',
  'extensive_listening',
];

export const QUESTION_KINDS: QuestionKind[] = [
  'vocab.mc',
  'vocab.fill',
  'vocab.jp2en',
  'listening.mc',
  'listening.tf',
  'dictation.partial',
  'dictation.functional',
  'dictation.full',
  'shadow.full',
  'speaking.jp2en',
  'speaking.read',
  'retention.free',
];

export const PHASE_LABELS_JA: Record<PhaseName, string> = {
  vocab: '語彙・文法・表現',
  listening: '多聴',
  dictation: '精聴・ディクテーション',
  shadowing: 'シャドーイング',
  speaking: 'スピーキング',
  retention: 'リテンションテスト',
  review: '復習',
  extensive_listening: '多聴（流し）',
};
