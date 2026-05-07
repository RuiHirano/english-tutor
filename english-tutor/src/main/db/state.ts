import type {
  ActiveMaterial,
  LearningState,
  Material,
  PhaseDescriptor,
  PhaseName,
  Profile,
  SessionRecord,
} from '@shared/types';
import { getDb } from './connection';
import { listMistakes } from './mistakes';

const FLOW_PHASES: PhaseName[] = [
  'vocab',
  'listening',
  'dictation',
  'shadowing',
  'speaking',
  'retention',
];

export function summarize(): LearningState {
  const db = getDb();
  const profile = db
    .prepare('SELECT * FROM user_profile WHERE id = 1')
    .get() as unknown as Profile | undefined;
  const materials = db
    .prepare(
      `SELECT id, title, script, mastery_level, total_appearances,
              last_appeared_at, started_at, ended_at, created_at
         FROM materials
        WHERE mastery_level < 3
        ORDER BY (last_appeared_at IS NULL), last_appeared_at DESC, created_at DESC`,
    )
    .all() as unknown as Material[];

  const active_materials: ActiveMaterial[] = materials.map((m) => {
    const sessions = db
      .prepare(
        `SELECT phase, started_at, ended_at
           FROM sessions
          WHERE material_id = ?
          ORDER BY started_at DESC LIMIT 20`,
      )
      .all(m.id) as unknown as Pick<SessionRecord, 'phase' | 'started_at' | 'ended_at'>[];
    const newRow = db
      .prepare(
        `SELECT COUNT(*) AS c
           FROM vocabulary_items
          WHERE material_id = ? AND last_appeared_at IS NULL`,
      )
      .get(m.id) as { c: number };
    return { ...m, recent_sessions: sessions, new_vocab_count: newRow.c };
  });

  return {
    profile_missing: !profile,
    profile: profile ?? null,
    active_materials,
    mistakes: listMistakes(30),
  };
}

function hoursSince(iso: string | null): number {
  if (!iso) return Infinity;
  const t = Date.parse(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / 3_600_000;
}

function lastCompletedSession(materialId: number, phase: PhaseName): string | null {
  const row = getDb()
    .prepare(
      `SELECT started_at FROM sessions
        WHERE material_id = ? AND phase = ? AND ended_at IS NOT NULL
        ORDER BY started_at DESC LIMIT 1`,
    )
    .get(materialId, phase) as { started_at: string } | undefined;
  return row?.started_at ?? null;
}

export function decideNextPhase(state: LearningState, materialId?: number): PhaseDescriptor {
  if (state.profile_missing) return { kind: 'profile-setup' };
  if (state.active_materials.length === 0) return { kind: 'material-new' };

  const material =
    (materialId !== undefined &&
      state.active_materials.find((m) => m.id === materialId)) ||
    state.active_materials[0];

  // 順次フローでまだ完了していない最初のフェーズを返す。
  // retention は未解決ミスが無ければスキップ。
  for (const phase of FLOW_PHASES) {
    if (lastCompletedSession(material.id, phase)) continue;
    if (phase === 'retention' && state.mistakes.length === 0) continue;
    return { kind: 'phase', materialId: material.id, phase };
  }

  const allLast = material.recent_sessions[0]?.started_at ?? null;
  if (allLast && hoursSince(allLast) > 48) {
    return { kind: 'phase', materialId: material.id, phase: 'review' };
  }

  return { kind: 'material-new' };
}

export function listActiveMaterials(): ActiveMaterial[] {
  return summarize().active_materials;
}
