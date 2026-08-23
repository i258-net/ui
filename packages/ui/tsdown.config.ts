import { defineConfig } from "tsdown";

// DTS via `tsc --emitDeclarationOnly` — tsdown/rolldown-plugin-dts broke on TS 7.0.2
// (useCaseSensitiveFileNames) in scaffold smoke 2026-08-23.
export default defineConfig({
  entry: [
    "src/index.ts",
    "src/components/button.tsx",
    "src/components/input.tsx",
    "src/components/textarea.tsx",
    "src/components/label.tsx",
    "src/components/link.tsx",
    "src/components/checkbox.tsx",
    "src/components/badge.tsx",
    "src/components/surface.tsx",
    "src/components/alert.tsx",
    "src/components/toggle-chip.tsx",
  ],
  format: ["esm"],
  dts: false,
  clean: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@radix-ui/react-slot",
    "@radix-ui/react-checkbox",
  ],
});
