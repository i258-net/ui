// typescript-eslint hard-rejects TypeScript 7.0 (peer still <6.1.0; runtime
// guard at import). Lint returns when that peer widens — see vision doc.
console.log(
  "lint deferred: typescript-eslint does not support TypeScript 7.0 yet",
);
