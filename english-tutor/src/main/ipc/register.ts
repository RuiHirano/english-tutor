import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import type { IpcChannel, IpcMap } from '@shared/ipc';
import { registerDbHandlers } from './db.handlers';
import { registerClaudeHandlers } from './claude.handlers';
import { registerEvalHandlers } from './eval.handlers';
import { registerAudioHandlers } from './audio.handlers';

type Handler<C extends IpcChannel> = (
  payload: IpcMap[C]['req'],
) => Promise<IpcMap[C]['res']> | IpcMap[C]['res'];

const handlers = new Map<IpcChannel, Handler<IpcChannel>>();

export function setHandler<C extends IpcChannel>(channel: C, handler: Handler<C>) {
  handlers.set(channel, handler as unknown as Handler<IpcChannel>);
}

export function registerIpcHandlers(ipc: IpcMain) {
  registerDbHandlers();
  registerClaudeHandlers();
  registerEvalHandlers();
  registerAudioHandlers();

  for (const [channel, handler] of handlers.entries()) {
    ipc.handle(channel, async (_event: IpcMainInvokeEvent, payload: unknown) => {
      try {
        return await handler(payload as never);
      } catch (err) {
        console.error(`[ipc:${channel}]`, err);
        throw err;
      }
    });
  }
}
