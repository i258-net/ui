#!/usr/bin/env python3
"""Assert every Chromatic pilot story name resolves to a real story.

chromatic-cli only checks that an onlyStoryNames entry contains a "/"
(getOptions.ts -> invalidOnlyStoryNames). An entry that matches no story is
captured as nothing, and the "UI Tests" status still reports success against a
project-wide total that does not move with the capture set — so a renamed or
mistyped entry silently drops coverage. See i258-net/dotbuzz#446.

Env:
  STORY_LIST       path to chromatic-stories.txt (default: apps/workshop/chromatic-stories.txt)
  STORYBOOK_INDEX  path to the built index.json (default: apps/workshop/storybook-static/index.json)
  GITHUB_OUTPUT    if set, the resolved names are written back as a "names" output
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

STORY_LIST = Path(os.environ.get("STORY_LIST", "apps/workshop/chromatic-stories.txt"))
STORYBOOK_INDEX = Path(
    os.environ.get("STORYBOOK_INDEX", "apps/workshop/storybook-static/index.json")
)
GITHUB_OUTPUT = os.environ.get("GITHUB_OUTPUT", "")

# chromatic-cli globs onlyStoryNames through picomatch, but this resolver only
# understands literal names — refuse a pattern rather than report it unresolved.
# Deliberately narrow: bare "+" or "@" are legal in a story name, they are only
# glob syntax immediately before "(".
GLOB_CHARS = set("*?[]{}")
EXTGLOB_PREFIXES = ("@(", "+(", "!(")


def is_glob(name: str) -> bool:
    return (
        bool(GLOB_CHARS & set(name))
        or name.startswith("!")
        or any(p in name for p in EXTGLOB_PREFIXES)
    )


def main() -> int:
    for path in (STORY_LIST, STORYBOOK_INDEX):
        if not path.is_file():
            print(f"missing {path}", file=sys.stderr)
            return 1

    wanted: list[str] = []
    for raw in STORY_LIST.read_text().splitlines():
        line = raw.strip()
        if line and not line.startswith("#"):
            wanted.append(line)
    if not wanted:
        print(f"{STORY_LIST} lists no stories", file=sys.stderr)
        return 1

    index = json.loads(STORYBOOK_INDEX.read_text())
    entries = index.get("entries")
    if not isinstance(entries, dict) or not entries:
        print(f"{STORYBOOK_INDEX} has no entries — was the build run?", file=sys.stderr)
        return 1
    # Chromatic matches against "<title>/<name>", the same pair Storybook writes
    # per index entry. Docs entries are excluded: onlyStoryNames never captures
    # Docs (see apps/workshop/vrt/docs.spec.ts), so a Docs entry here would
    # resolve and still snapshot nothing — the exact failure this guards.
    available = {
        f"{e['title']}/{e['name']}"
        for e in entries.values()
        if e.get("type") == "story"
    }

    bad: list[str] = []
    for name in wanted:
        if "/" not in name:
            bad.append(f"{name}  (no '/' — chromatic-cli rejects this outright)")
        elif is_glob(name):
            bad.append(f"{name}  (glob patterns are not supported by this check)")
        elif name not in available:
            bad.append(f"{name}  (matches no story in {STORYBOOK_INDEX})")

    if bad:
        print(
            f"{len(bad)} of {len(wanted)} pilot entries do not resolve:", file=sys.stderr
        )
        for line in bad:
            print(f"  {line}", file=sys.stderr)
        print(
            f"\n{len(available)} stories are available. Fix {STORY_LIST} or the story.",
            file=sys.stderr,
        )
        return 1

    print(f"all {len(wanted)} pilot entries resolve ({len(available)} stories indexed)")
    for name in wanted:
        print(f"  {name}")

    if GITHUB_OUTPUT:
        with open(GITHUB_OUTPUT, "a", encoding="utf-8") as fh:
            fh.write("names<<CHROMATIC_STORIES_EOF\n")
            fh.write("".join(f"{n}\n" for n in wanted))
            fh.write("CHROMATIC_STORIES_EOF\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
