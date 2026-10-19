// Vite / Vitest `?raw` imports (used by tests that read the shipped CSS).
declare module "*?raw" {
  const content: string;
  export default content;
}
