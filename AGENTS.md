# i258-net/ui

Tier 2 domain: Rivet. Vision: `i258-net/dotbuzz` `PLANS/I258_DESIGN_SYSTEM_VISION.md`.

- Default package manager: **pnpm** (see root `packageManager`).
- TypeScript **7** here; consumers may stay on 5 — keep emitted `.d.ts` consumable.
- CSS: Tailwind v4 `@tailwindcss/cli` with `@layer i258-components` + plain `--i258-*` custom properties only (no `@theme` / no `tailwindcss/theme` — those emit unprefixed vars that collide with consumer Tailwind). No utilities/preflight in the shipped file. Consumers import compiled CSS; they must not Tailwind-scan this package. Consumer apps must declare layer order before imports (see README).
- License: MIT, Copyright (c) 2026 Daniel Newton.
- No externally visible publish without Daniel's say-so. First publish: interactive `npm login` + `npm publish` on his Mac; then OIDC. No bootstrap token in repo secrets.

## Code Review Rules

Automated reviewers follow this section: Codex reads it directly, and CodeRabbit reads this file as a coding guideline.

### Priority

- **P1** is for a defect that does one of these:
  - breaks a documented behaviour of an exported component, hook or utility (a caller's handler or prop silently replaced or ignored, a shortcut that never fires);
  - regresses keyboard use, focus, roles or accessible names;
  - lets CSS escape `@layer i258-components`, or emits unprefixed custom properties or Tailwind `@theme` output;
  - makes emitted `.d.ts` unusable from TypeScript 5;
  - publishes or exposes anything externally.
- **P2** is for other visible defects, Storybook or VRT tests that are flaky or cannot fail, and README text that contradicts behaviour.
- Do not report style, naming, formatting, docstring coverage, or anything the `check` job already catches.
- On a dependency bump, report only engine or peer incompatibilities and breaking changes that affect this repo.

### Later commits

On a later commit, review what changed since your last review. Do not raise new P2 findings on code you already reviewed that has not changed. If an earlier finding of yours still applies, say so once instead of raising it again as new.

## Automated review findings

Greptile, CodeRabbit and Codex review every pull request. When answering them:

- Check each finding against the code before acting on it. If it is wrong, reply with the reason in one line and leave the code alone.
- Fix every P1. After two review rounds, put the remaining P2 findings into one follow-up commit or one issue. Do not run a further round for each finding.
- When a round brings only low-value findings, stop and say so on the pull request.
- Codex does not resolve its own threads. Reply to each Codex thread you fixed with the commit, then resolve it.
- Before merging, wait until every reviewer has posted on the final head commit, and read what they posted.
