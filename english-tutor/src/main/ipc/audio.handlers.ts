import { spawn } from 'node:child_process';
import { setHandler } from './register';

function say(text: string, voice?: string, rate?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const args: string[] = [];
    if (voice) args.push('-v', voice);
    if (rate) args.push('-r', String(rate));
    args.push(text);
    const child = spawn('say', args, { stdio: 'ignore' });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`say exited ${code}`)),
    );
  });
}

export function registerAudioHandlers() {
  setHandler('audio:tts.say', async ({ text, voice, rate }) => {
    await say(text, voice, rate);
    return { ok: true } as const;
  });
}
