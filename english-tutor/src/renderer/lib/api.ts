import type { IpcChannel, IpcMap } from '@shared/ipc';

export function call<C extends IpcChannel>(
  channel: C,
  payload: IpcMap[C]['req'],
): Promise<IpcMap[C]['res']> {
  return window.api.invoke(channel, payload);
}
