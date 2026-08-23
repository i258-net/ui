# i258 Design System (`i258-net/ui`)

Shared UI for i258 apps. Human-facing name: **i258 Design System**. Package: **`@i258/ui`**. Workshop: **i258 UI**.

Vision and decisions live in `i258-net/dotbuzz` → `PLANS/I258_DESIGN_SYSTEM_VISION.md` (I25-153).

## Status

Scaffold / baseline theme v1. Not a finished brand. First consumer: Honeycomb board chrome.

| | |
|---|---|
| Repo | public |
| Package | `@i258/ui` on npmjs.org (org `i258`) — not published yet |
| License | MIT — Copyright (c) 2026 Daniel Newton |
| Stack | pnpm · TypeScript 7 · Tailwind v4 (`@theme` → compiled CSS) · Radix/CVA · Storybook 10 |
| Themes | light + dark semantic tokens |
| Lint | deferred until typescript-eslint supports TS 7 (hard reject on 7.0.2) |

Consumers import **compiled** CSS (`@i258/ui/styles.css`). They do **not** Tailwind-scan this package's source. The package builds CSS with `@tailwindcss/cli` using **theme + `@layer components` only** (no preflight, no utilities) so consumer Tailwind utilities cannot collide with ours. Component classes are package-owned (`i258-*`).

## Workspace

```
packages/ui     # @i258/ui
apps/workshop   # Storybook 10
```

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm workshop   # http://localhost:6006
```

## Using `@i258/ui` (once published)

```ts
import { Button } from "@i258/ui";
import "@i258/ui/styles.css";
```

Wrap the app (or a subtree) with `data-theme="light"` or `data-theme="dark"`. Without an explicit theme, dark follows `prefers-color-scheme`.

## Releases

- CI/release workflow YAML lives in `docs/github-workflows/` until someone pastes them into `.github/workflows/` (preferred: Daniel, one-time — `rivet-i258` cannot push workflow files without App `workflows` write, which we are not requesting).
- **First publish (when Rivet says ready):** on Daniel's Mac — `npm login` (2FA), then `npm publish --access public` in the built `packages/ui` dir. **No token minted, nothing stored in repo secrets.**
- Then configure Trusted Publisher on npmjs (`@i258/ui` → Settings → GitHub Actions: org `i258-net`, repo `ui`, workflow `release.yml`). Later tags publish via OIDC only.

## Contribution rules (short)

- Token for a recurring design decision.
- Primitive for reusable interaction behavior.
- Variant when the difference is semantic.
- Shared pattern after **two** real consumers need it.
- No app-domain terminology in `@i258/ui`.
