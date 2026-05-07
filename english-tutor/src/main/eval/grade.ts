import type { GradeRequest, GradeResult } from '@shared/ipc';
import { normalize } from './normalize';
import { similarity } from './similarity';

const PARTIAL_OK = 0.85;
const SHADOW_OK = 0.7;
const JP2EN_AUTO_OK = 0.92;
const JP2EN_AUTO_REJECT = 0.4;

export function grade(req: GradeRequest): GradeResult {
  const { kind, correct, user } = req;
  const nUser = normalize(user);
  const nCorrect = normalize(correct);

  switch (kind) {
    case 'vocab.mc':
    case 'listening.mc':
    case 'listening.tf':
      return { isCorrect: nUser === nCorrect, normalizedUser: nUser };

    case 'vocab.fill':
    case 'dictation.full':
      return { isCorrect: nUser === nCorrect, normalizedUser: nUser };

    case 'dictation.partial':
    case 'dictation.functional': {
      const sim = similarity(nUser, nCorrect);
      return { isCorrect: sim >= PARTIAL_OK, normalizedUser: nUser, similarity: sim };
    }

    case 'shadow.full': {
      const sim = similarity(nUser, nCorrect);
      return { isCorrect: sim >= SHADOW_OK, normalizedUser: nUser, similarity: sim };
    }

    case 'vocab.jp2en': {
      const sim = similarity(nUser, nCorrect);
      if (sim >= JP2EN_AUTO_OK) {
        return { isCorrect: true, normalizedUser: nUser, similarity: sim };
      }
      if (sim < JP2EN_AUTO_REJECT) {
        return {
          isCorrect: false,
          normalizedUser: nUser,
          similarity: sim,
          requiresAI: true,
        };
      }
      return {
        isCorrect: false,
        normalizedUser: nUser,
        similarity: sim,
        requiresAI: true,
      };
    }

    case 'speaking.jp2en':
    case 'speaking.read':
    case 'retention.free':
      return { isCorrect: false, normalizedUser: nUser, requiresAI: true };

    default:
      return { isCorrect: false, normalizedUser: nUser };
  }
}
