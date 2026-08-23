# i258 Design System (`i258-net/ui`)

Shared UI for i258 apps. Human-facing name: **i258 Design System**. Package: **`@i258/ui`**. Workshop: **i258 UI**.

Vision and decisions live in `i258-net/dotbuzz` → `PLANS/I258_DESIGN_SYSTEM_VISION.md` (I25-153).

## Status

Scaffold / baseline theme v1. Not a finished brand. First consumer: Honeycomb board chrome.

| | |
|---|---|
| Repo | public |
| Package | `@i258/ui` on npmjs.org (org `i258`) — not published yet |
| Stack | pnpm · TypeScript 7 · Radix/CVA · compiled CSS · Storybook 10 |
| Themes | light + dark semantic tokens |
| Lint | deferred until typescript-eslint supports TS 7 (hard reject on 7.0.2) |

Consumers import compiled CSS; they do **not** scan this package's source with Tailwind. Tailwind v4 enters as the authoring/`@theme` toolchain as the surface grows — the public contract stays compiled JS + CSS.

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

- Intended: semver tags (`v*`) trigger a release workflow (see `docs/github-workflows/`).
- **Those YAML files are parked under `docs/`** until `rivet-i258` has GitHub App `workflows` write (push to `.github/workflows/` was refused). After permission lands, move them to `.github/workflows/`.
- **OIDC trusted publishing** after the package exists on npm and a trusted publisher is configured for this repo + workflow.
- **First publish** needs a one-time granular npm token from the org owner (trusted-publisher settings live on the package). Subsequent publishes are tokenless.

## Contribution rules (short)

- Token for a recurring design decision.
- Primitive for reusable interaction behavior.
- Variant when the difference is semantic.
- Shared pattern after **two** real consumers need it.
- No app-domain terminology in `@i258/ui`.
