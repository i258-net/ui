import { defineConfig } from "tsdown";

// DTS via `tsc --emitDeclarationOnly` — tsdown/rolldown-plugin-dts broke on TS 7.0.2
// (useCaseSensitiveFileNames) in scaffold smoke 2026-08-23.
export default defineConfig({
  entry: ["src/index.ts", "src/components/button.tsx"],
  format: ["esm"],
  dts: false,
  clean: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
});
