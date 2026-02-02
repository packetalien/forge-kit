/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    ping: () => Promise<string>;
  };
}
