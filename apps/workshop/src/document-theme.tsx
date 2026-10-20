import * as React from "react";
import type { Decorator } from "@storybook/react-vite";
import { isApplePlatform } from "@i258/ui";

/**
 * Dialogs and menus outside an AppFrame portal to `document.body`, outside
 * the story's themed host. Apps set `data-theme` on `<html>` (themeScript
 * does), so do the same here for the story's lifetime and the popups pick
 * up the toolbar theme.
 */
function DocumentTheme({ theme, children }: { theme: string; children: React.ReactNode }) {
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute("data-theme");
    root.setAttribute("data-theme", theme);
    return () => {
      if (prev === null) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", prev);
    };
  }, [theme]);
  return children;
}

export const withDocumentTheme: Decorator = (Story, context) => (
  <DocumentTheme theme={(context.globals.theme as string) ?? "light"}>
    <Story />
  </DocumentTheme>
);

/** The key `mod` means here, for userEvent.keyboard (`{Meta>}k{/Meta}`). */
export function modKey(): "Meta" | "Control" {
  return isApplePlatform() ? "Meta" : "Control";
}
