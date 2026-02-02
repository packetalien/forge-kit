/// <reference types="vite/client" />

declare module '*.wgsl?raw' {
  const src: string;
  export default src;
}

interface Window {
  electronAPI?: {
    ping: () => Promise<string>;
  };
}
