# i258-net/ui

Tier 2 domain: Rivet. Vision: `i258-net/dotbuzz` `PLANS/I258_DESIGN_SYSTEM_VISION.md`.

- Default package manager: **pnpm** (see root `packageManager`).
- TypeScript **7** here; consumers may stay on 5 — keep emitted `.d.ts` consumable.
- Do not require consumers to Tailwind-scan this package; ship compiled CSS.
- No externally visible publish without Daniel's say-so (first npm publish needs his bootstrap token).
