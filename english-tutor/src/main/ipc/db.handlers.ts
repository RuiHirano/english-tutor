import { setHandler } from './register';
import { getProfile, upsertProfile } from '@main/db/profile';
import {
  createMaterial,
  getMaterial,
  listMaterials,
  listMaterialsWithProgress,
  setMaterialMastery,
} from '@main/db/material';
import { pickDue } from '@main/db/due';
import { listMistakes } from '@main/db/mistakes';
import { closeSession, openSession } from '@main/db/session';
import { recordQuestion } from '@main/db/record';
import { setVocabMastery } from '@main/db/mastery';
import { decideNextPhase, listActiveMaterials, summarize } from '@main/db/state';
import { dailyActivity, masteryDistribution, overallStats } from '@main/db/stats';

export function registerDbHandlers() {
  setHandler('db:profile.get', () => getProfile());
  setHandler('db:profile.upsert', (p) => upsertProfile(p));

  setHandler('db:material.list', ({ activeOnly }) => listMaterials(activeOnly));
  setHandler('db:material.listWithProgress', ({ activeOnly }) =>
    listMaterialsWithProgress(activeOnly),
  );
  setHandler('db:material.get', ({ id }) => getMaterial(id));
  setHandler('db:material.create', (p) => createMaterial(p));
  setHandler('db:material.setMastery', ({ id, level }) => {
    setMaterialMastery(id, level);
  });

  setHandler('db:vocab.due', ({ type, materialId, limit }) =>
    pickDue({ type, materialId, limit }),
  );
  setHandler('db:vocab.mistakes', ({ limit }) => listMistakes(limit));
  setHandler('db:vocab.setMastery', ({ id, level }) => {
    setVocabMastery(id, level);
  });

  setHandler('db:session.open', ({ materialId, phase }) => ({
    sessionId: openSession(materialId, phase),
  }));
  setHandler('db:session.close', ({ sessionId }) => {
    closeSession(sessionId);
  });
  setHandler('db:question.record', (p) => ({ questionId: recordQuestion(p) }));

  setHandler('db:state.summarize', () => summarize());
  setHandler('db:state.next', () => decideNextPhase(summarize()));
  setHandler('db:state.nextForMaterial', ({ materialId }) =>
    decideNextPhase(summarize(), materialId),
  );
  setHandler('db:state.activeMaterials', () => listActiveMaterials());

  setHandler('db:stats.overall', () => overallStats());
  setHandler('db:stats.daily', ({ days }) => dailyActivity(days));
  setHandler('db:stats.masteryDistribution', ({ scope }) => masteryDistribution(scope));
}
