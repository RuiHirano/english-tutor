import type { MasteryLevel } from '@shared/types';
import { getDb } from './connection';

export function setVocabMastery(id: number, level: MasteryLevel): void {
  getDb().prepare('UPDATE vocabulary_items SET mastery_level = ? WHERE id = ?').run(level, id);
}
