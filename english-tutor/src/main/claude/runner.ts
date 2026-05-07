import { spawn } from 'node:child_process';
import { app } from 'electron';
import path from 'node:path';

export type ClaudeTask =
  | 'material-new'
  | 'eval-speaking'
  | 'eval-retention'
  | 'eval-jp2en'
  | 'transcribe';

export class ClaudeError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ClaudeError';
  }
}

export class ClaudeNotFoundError extends ClaudeError {
  constructor() {
    super('Claude CLI not found. Install with `npm i -g @anthropic-ai/claude-code` and restart.');
    this.name = 'ClaudeNotFoundError';
  }
}

interface RunOptions {
  timeoutMs?: number;
}

function projectRoot(): string {
  if (app.isPackaged) return process.resourcesPath;
  return path.resolve(app.getAppPath(), '..');
}

export function runClaude(
  prompt: string,
  options: RunOptions = {},
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 60_000;

  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['--print'], {
      cwd: projectRoot(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });

    child.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      if (err.code === 'ENOENT') {
        reject(new ClaudeNotFoundError());
      } else {
        reject(new ClaudeError(err.message, err));
      }
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new ClaudeError(`claude --print timed out after ${timeoutMs}ms`));
        return;
      }
      if (code !== 0) {
        reject(
          new ClaudeError(
            `claude --print exited with code ${code}: ${stderr.trim() || '(no stderr)'}`,
          ),
        );
        return;
      }
      resolve(stdout);
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

export function extractJsonObject(raw: string): unknown {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        return JSON.parse(raw.slice(start, i + 1));
      }
    }
  }
  throw new ClaudeError(`No JSON object found in output. Raw: ${raw.slice(0, 200)}`);
}

export async function runClaudeJson(prompt: string, options?: RunOptions): Promise<unknown> {
  const raw = await runClaude(prompt, options);
  return extractJsonObject(raw);
}
