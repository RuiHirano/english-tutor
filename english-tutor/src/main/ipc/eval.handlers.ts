import { setHandler } from './register';
import { grade } from '@main/eval/grade';

export function registerEvalHandlers() {
  setHandler('eval:grade', (p) => grade(p));
}
