// src/global.d.ts

export {}; // mark as a module

declare global {
  interface Window {
    solflare?: any;
  }
}
