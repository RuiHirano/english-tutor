import type {
  ActiveMaterial,
  DailyActivity,
  Evaluation,
  LearningState,
  MasteryDistribution,
  MasteryLevel,
  Material,
  MaterialDraft,
  OverallStats,
  PhaseDescriptor,
  PhaseName,
  Profile,
  QuestionKind,
  RecordPayload,
  SessionRecord,
  VocabDue,
  VocabItem,
  VocabItemDraft,
  VocabMistake,
  VocabType,
} from './types';

export interface MaterialWithVocab extends Material {
  vocabulary_items: VocabItem[];
  sessions: SessionRecord[];
}

export interface MaterialWithProgress extends Material {
  completed_phases: string[];
  vocab_count: number;
}

export interface CreateMaterialResult {
  materialId: number;
  vocabularyItemIds: number[];
}

export interface ListeningQuizItem {
  kind: 'mc' | 'tf';
  question: string;
  options?: string[];
  answer: string;
}

export interface DictationItem {
  kind: 'partial' | 'functional' | 'full';
  sentence: string;
  prompt: string;
  blanks: string[];
}

export interface Jp2EnDrill {
  japanese: string;
  english: string;
  term: string;
}

export interface ReadAloudDrill {
  sentence: string;
}

export interface SpeakingDrills {
  jp_to_en: Jp2EnDrill[];
  read_aloud: ReadAloudDrill[];
}

export interface GradeRequest {
  kind: QuestionKind;
  correct: string;
  user: string;
  meta?: { options?: string[] };
}

export interface GradeResult {
  isCorrect: boolean;
  normalizedUser: string;
  similarity?: number;
  feedback?: string;
  requiresAI?: boolean;
}

export interface IpcMap {
  'db:profile.get': { req: void; res: Profile | null };
  'db:profile.upsert': { req: Profile; res: Profile };
  'db:material.list': { req: { activeOnly?: boolean }; res: Material[] };
  'db:material.listWithProgress': {
    req: { activeOnly?: boolean };
    res: MaterialWithProgress[];
  };
  'db:material.get': { req: { id: number }; res: MaterialWithVocab | null };
  'db:material.create': {
    req: { title: string; script: string; script_ja?: string; items: VocabItemDraft[] };
    res: CreateMaterialResult;
  };
  'db:material.setMastery': { req: { id: number; level: MasteryLevel }; res: void };
  'db:vocab.due': {
    req: { type?: VocabType; materialId?: number; limit: number };
    res: VocabDue[];
  };
  'db:vocab.mistakes': { req: { limit: number }; res: VocabMistake[] };
  'db:vocab.setMastery': { req: { id: number; level: MasteryLevel }; res: void };
  'db:session.open': { req: { materialId: number; phase: PhaseName }; res: { sessionId: number } };
  'db:session.close': { req: { sessionId: number }; res: void };
  'db:question.record': { req: RecordPayload; res: { questionId: number } };
  'db:state.summarize': { req: void; res: LearningState };
  'db:state.next': { req: void; res: PhaseDescriptor };
  'db:state.nextForMaterial': { req: { materialId: number }; res: PhaseDescriptor };
  'db:state.activeMaterials': { req: void; res: ActiveMaterial[] };
  'db:stats.overall': { req: void; res: OverallStats };
  'db:stats.daily': { req: { days: number }; res: DailyActivity[] };
  'db:stats.masteryDistribution': {
    req: { scope: 'materials' | 'vocabulary_items' };
    res: MasteryDistribution[];
  };
  'claude:generateMaterial': {
    req: { profile: Profile; mistakes: VocabMistake[]; constraints?: string };
    res: MaterialDraft;
  };
  'claude:generateListeningQuiz': {
    req: { script: string; level: string };
    res: ListeningQuizItem[];
  };
  'claude:generateDictationItems': {
    req: { script: string; level: string };
    res: DictationItem[];
  };
  'claude:generateSpeakingDrills': {
    req: { script: string; terms: Array<{ term: string; meaning: string | null; type: VocabType | null }>; level: string };
    res: SpeakingDrills;
  };
  'claude:evaluateSpeaking': {
    req: { prompt: string; targetExpressions: string[]; userTranscript: string };
    res: Evaluation;
  };
  'claude:evaluateRetention': {
    req: { requiredExpressions: string[]; userTranscript: string };
    res: Evaluation;
  };
  'claude:evaluateJp2En': {
    req: { japanese: string; modelAnswer: string; userAnswer: string };
    res: Evaluation;
  };
  'claude:transcribe': { req: { audioPath: string }; res: { text: string } };
  'eval:grade': { req: GradeRequest; res: GradeResult };
  'audio:tts.say': { req: { text: string; voice?: string; rate?: number }; res: { ok: true } };
}

export type IpcChannel = keyof IpcMap;

export interface ApiBridge {
  invoke<C extends IpcChannel>(channel: C, payload: IpcMap[C]['req']): Promise<IpcMap[C]['res']>;
}

export const IPC_CHANNELS: IpcChannel[] = [
  'db:profile.get',
  'db:profile.upsert',
  'db:material.list',
  'db:material.listWithProgress',
  'db:material.get',
  'db:material.create',
  'db:material.setMastery',
  'db:vocab.due',
  'db:vocab.mistakes',
  'db:vocab.setMastery',
  'db:session.open',
  'db:session.close',
  'db:question.record',
  'db:state.summarize',
  'db:state.next',
  'db:state.nextForMaterial',
  'db:state.activeMaterials',
  'db:stats.overall',
  'db:stats.daily',
  'db:stats.masteryDistribution',
  'claude:generateMaterial',
  'claude:generateListeningQuiz',
  'claude:generateDictationItems',
  'claude:generateSpeakingDrills',
  'claude:evaluateSpeaking',
  'claude:evaluateRetention',
  'claude:evaluateJp2En',
  'claude:transcribe',
  'eval:grade',
  'audio:tts.say',
];
