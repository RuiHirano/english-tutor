export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type VocabType = 'vocab' | 'grammar' | 'expression';
export type MasteryLevel = 0 | 1 | 2 | 3;

export type PhaseName =
  | 'vocab'
  | 'listening'
  | 'dictation'
  | 'shadowing'
  | 'speaking'
  | 'retention'
  | 'review'
  | 'extensive_listening';

export type QuestionKind =
  | 'vocab.mc'
  | 'vocab.fill'
  | 'vocab.jp2en'
  | 'listening.mc'
  | 'listening.tf'
  | 'dictation.partial'
  | 'dictation.functional'
  | 'dictation.full'
  | 'shadow.full'
  | 'speaking.jp2en'
  | 'speaking.read'
  | 'retention.free';

export interface Profile {
  id?: 1;
  goal: string;
  level: CefrLevel;
  interests: string;
}

export interface Material {
  id: number;
  title: string;
  script: string;
  script_ja: string | null;
  total_appearances: number;
  last_appeared_at: string | null;
  mastery_level: MasteryLevel;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface ExampleSentence {
  en: string;
  ja: string;
}

export interface VocabItem {
  id: number;
  material_id: number | null;
  term: string;
  meaning: string | null;
  type: VocabType | null;
  examples: ExampleSentence[];
  total_appearances: number;
  last_appeared_at: string | null;
  mastery_level: MasteryLevel;
  created_at: string;
}

export interface VocabDue extends VocabItem {
  due_score: number;
}

export interface VocabMistake {
  id: number;
  term: string;
  meaning: string | null;
  type: VocabType | null;
  material_id: number | null;
  last_question_text: string;
  last_correct_answer: string;
  last_user_answer: string | null;
  last_feedback: string | null;
  last_asked_at: string;
}

export interface SessionRecord {
  id: number;
  material_id: number;
  phase: PhaseName;
  started_at: string;
  ended_at: string | null;
}

export interface QuestionRecord {
  id: number;
  session_id: number;
  material_id: number;
  vocabulary_item_id: number | null;
  phase: PhaseName;
  question_text: string;
  correct_answer: string;
  user_answer: string | null;
  is_correct: 0 | 1;
  feedback: string | null;
  asked_at: string;
}

export interface ActiveMaterial extends Material {
  recent_sessions: Array<Pick<SessionRecord, 'phase' | 'started_at' | 'ended_at'>>;
  new_vocab_count: number;
}

export interface LearningState {
  profile_missing: boolean;
  profile: Profile | null;
  active_materials: ActiveMaterial[];
  mistakes: VocabMistake[];
}

export type PhaseDescriptor =
  | { kind: 'profile-setup' }
  | { kind: 'material-new' }
  | { kind: 'phase'; materialId: number; phase: PhaseName };

export interface VocabItemDraft {
  term: string;
  meaning: string;
  type: VocabType;
  examples?: ExampleSentence[];
}

export interface MaterialDraft {
  title: string;
  script: string;
  script_ja: string;
  items: VocabItemDraft[];
}

export interface Evaluation {
  isCorrect: boolean;
  score?: number;
  feedback: string;
  modelAnswer?: string;
}

export interface RecordPayload {
  sessionId: number;
  materialId: number;
  vocabularyItemId: number | null;
  phase: PhaseName;
  questionText: string;
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
  feedback: string | null;
}

export interface OverallStats {
  total_materials: number;
  total_vocabulary_items: number;
  total_sessions: number;
  total_questions: number;
  correct_questions: number;
  accuracy: number;
}

export interface DailyActivity {
  date: string;
  sessions: number;
  questions: number;
  correct: number;
}

export interface MasteryDistribution {
  mastery_level: MasteryLevel;
  n: number;
}
