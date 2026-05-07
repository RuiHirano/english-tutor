import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, type IpcChannel } from '@shared/ipc';

const channelSet = new Set<string>(IPC_CHANNELS);

contextBridge.exposeInMainWorld('api', {
  invoke: (channel: IpcChannel, payload: unknown) => {
    if (!channelSet.has(channel)) {
      return Promise.reject(new Error(`Unknown IPC channel: ${channel}`));
    }
    return ipcRenderer.invoke(channel, payload);
  },
});
