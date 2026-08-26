import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/react-vite";
import * as projectAnnotations from "./preview";

// Portable stories + a11y: without this, axe runs in the panel but not in vitest CLI/CI.
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
