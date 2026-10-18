import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vitest blanks CSS by default, `?raw` included. contrast.test.ts reads
    // the shipped theme source, so let that one file through untouched.
    css: { include: [/src\/styles\/themes\.css/] },
  },
});
