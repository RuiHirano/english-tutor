/// <reference types="vite/client" />

import type { ApiBridge } from './src/shared/ipc';

declare global {
  interface Window {
    api: ApiBridge;
  }
}

export {};
