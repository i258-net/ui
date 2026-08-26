/**
 * Chromatic pilot modes — mirror Playwright VRT light/dark globals.
 * Remove this file (and preview's chromatic block) to drop Chromatic.
 */
export const allModes = {
  light: {
    globals: { theme: "light" },
  },
  dark: {
    globals: { theme: "dark" },
  },
} as const;
