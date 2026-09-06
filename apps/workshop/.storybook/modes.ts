/**
 * Chromatic pilot modes — mirror Playwright VRT light/dark globals.
 * Apply `chromaticPilotParameters` only on the stories listed in
 * `apps/workshop/chromatic-stories.txt`, which `chromatic.yml` feeds to
 * `onlyStoryNames`. Keep modes off global preview so a shared decorator
 * change does not expand the accept matrix to every story × mode.
 */
export const allModes = {
  light: {
    theme: "light",
  },
  dark: {
    theme: "dark",
  },
} as const;

/** Story-level `parameters` for the Chromatic pilot set. */
export const chromaticPilotParameters = {
  chromatic: {
    modes: {
      light: allModes.light,
      dark: allModes.dark,
    },
  },
} as const;
