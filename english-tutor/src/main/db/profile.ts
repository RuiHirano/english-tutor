import type { Profile } from '@shared/types';
import { getDb } from './connection';

export function getProfile(): Profile | null {
  const row = getDb()
    .prepare('SELECT id, goal, level, interests FROM user_profile WHERE id = 1')
    .get() as unknown as Profile | undefined;
  return row ?? null;
}

export function upsertProfile(p: Profile): Profile {
  getDb()
    .prepare(
      `INSERT INTO user_profile (id, goal, level, interests)
       VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         goal = excluded.goal,
         level = excluded.level,
         interests = excluded.interests`,
    )
    .run(p.goal, p.level, p.interests);
  return getProfile()!;
}
