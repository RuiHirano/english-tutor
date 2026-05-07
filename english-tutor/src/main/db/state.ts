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

const DAY1_PHASES: PhaseName[] = ['vocab', 'listening', 'dictation'];
const DAY2_PHASES: PhaseName[] = ['shadowing', 'speaking', 'retention'];

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

function lastSessionFor(material: ActiveMaterial, phase: PhaseName): string | null {
  for (const s of material.recent_sessions) {
    if (s.phase === phase) return s.started_at;
  }
  return null;
}

export function decideNextPhase(state: LearningState): PhaseDescriptor {
  if (state.profile_missing) return { kind: 'profile-setup' };
  if (state.active_materials.length === 0) return { kind: 'material-new' };

  const material = state.active_materials[0];

  if (material.new_vocab_count > 0) {
    for (const phase of DAY1_PHASES) {
      const last = lastSessionFor(material, phase);
      if (!last || hoursSince(last) > 12) {
        return { kind: 'phase', materialId: material.id, phase };
      }
    }
  }

  const day1Done = DAY1_PHASES.every((p) => lastSessionFor(material, p) !== null);
  if (day1Done) {
    const lastShadow = lastSessionFor(material, 'shadowing');
    if (!lastShadow || hoursSince(lastShadow) > 24) {
      return { kind: 'phase', materialId: material.id, phase: 'shadowing' };
    }
    for (const phase of DAY2_PHASES.slice(1)) {
      if (!lastSessionFor(material, phase)) {
        return { kind: 'phase', materialId: material.id, phase };
      }
    }
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
