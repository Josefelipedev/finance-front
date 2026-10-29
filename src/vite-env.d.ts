/// <reference types="vite/client" />

declare module '*.css';
declare module '*.scss';
declare module '*.sass';

// Umami (index.html): sem cookies; só existe em produção.
interface Window {
  umami?: { track: (event: string, data?: Record<string, unknown>) => void };
}
