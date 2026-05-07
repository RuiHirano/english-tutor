import { setHandler } from './register';
import {
  evaluateJp2En,
  evaluateRetention,
  evaluateSpeaking,
  generateDictationItems,
  generateListeningQuiz,
  generateMaterial,
  generateSpeakingDrills,
} from '@main/claude/tasks';

export function registerClaudeHandlers() {
  setHandler('claude:evaluateJp2En', (p) => evaluateJp2En(p));
  setHandler('claude:evaluateSpeaking', (p) => evaluateSpeaking(p));
  setHandler('claude:evaluateRetention', (p) => evaluateRetention(p));
  setHandler('claude:generateMaterial', (p) => generateMaterial(p));
  setHandler('claude:generateListeningQuiz', (p) => generateListeningQuiz(p));
  setHandler('claude:generateDictationItems', (p) => generateDictationItems(p));
  setHandler('claude:generateSpeakingDrills', (p) => generateSpeakingDrills(p));
  setHandler('claude:transcribe', async () => {
    throw new Error('claude:transcribe is not implemented yet (Phase E2)');
  });
}
