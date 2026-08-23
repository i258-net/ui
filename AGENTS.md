# i258-net/ui

Tier 2 domain: Rivet. Vision: `i258-net/dotbuzz` `PLANS/I258_DESIGN_SYSTEM_VISION.md`.

- Default package manager: **pnpm** (see root `packageManager`).
- TypeScript **7** here; consumers may stay on 5 — keep emitted `.d.ts` consumable.
- CSS: Tailwind v4 `@tailwindcss/cli` with `@layer i258-components` + plain `--i258-*` custom properties only (no `@theme` / no `tailwindcss/theme` — those emit unprefixed vars that collide with consumer Tailwind). No utilities/preflight in the shipped file. Consumers import compiled CSS; they must not Tailwind-scan this package. Consumer apps must declare layer order before imports (see README).
- License: MIT, Copyright (c) 2026 Daniel Newton.
- No externally visible publish without Daniel's say-so. First publish: interactive `npm login` + `npm publish` on his Mac; then OIDC. No bootstrap token in repo secrets.
