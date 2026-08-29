#!/usr/bin/env python3
"""Replace the storybook image digest in a checkout of i258-net/k8s.

Env:
  DIGEST  sha256:<hex> from docker/build-push-action
  SOURCE_SHA  full git SHA of the ui commit that produced the image
  K8S_ROOT  path to the k8s checkout (default: .)
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

DIGEST = os.environ.get("DIGEST", "").strip()
SOURCE_SHA = os.environ.get("SOURCE_SHA", "").strip()
ROOT = Path(os.environ.get("K8S_ROOT", ".")).resolve()

DEP = ROOT / "clusters/home/apps/storybook/manifests/10-deployment.yaml"
ENVF = ROOT / "clusters/home/apps/storybook/versions.env"

IMAGE_RE = re.compile(
    r"image: ghcr\.io/i258-net/ui-workshop@sha256:[0-9a-f]+"
)
ENV_RE = re.compile(r"STORYBOOK_IMAGE_DIGEST=sha256:[0-9a-f]+")
# Comment markers in versions.env and 10-deployment.yaml header.
PROVENANCE_RE = re.compile(r"main@[0-9a-f]+")


def main() -> int:
    if not re.fullmatch(r"sha256:[0-9a-f]{64}", DIGEST):
        print(f"unexpected DIGEST {DIGEST!r}", file=sys.stderr)
        return 1
    if not re.fullmatch(r"[0-9a-f]{40}", SOURCE_SHA):
        print(f"unexpected SOURCE_SHA {SOURCE_SHA!r}", file=sys.stderr)
        return 1
    for path in (DEP, ENVF):
        if not path.is_file():
            print(f"missing {path}", file=sys.stderr)
            return 1

    short = SOURCE_SHA[:7]
    provenance = f"main@{short}"

    dep = DEP.read_text()
    env = ENVF.read_text()
    new_image = f"image: ghcr.io/i258-net/ui-workshop@{DIGEST}"
    new_env = f"STORYBOOK_IMAGE_DIGEST={DIGEST}"

    dep2, n1 = IMAGE_RE.subn(new_image, dep, count=1)
    env2, n2 = ENV_RE.subn(new_env, env, count=1)
    if n1 != 1:
        print(f"expected 1 image pin in {DEP}, got {n1}", file=sys.stderr)
        return 1
    if n2 != 1:
        print(f"expected 1 digest in {ENVF}, got {n2}", file=sys.stderr)
        return 1

    dep2, n3 = PROVENANCE_RE.subn(provenance, dep2)
    env2, n4 = PROVENANCE_RE.subn(provenance, env2)
    if n3 < 1:
        print(f"expected >=1 main@SHA in {DEP}, got {n3}", file=sys.stderr)
        return 1
    if n4 < 1:
        print(f"expected >=1 main@SHA in {ENVF}, got {n4}", file=sys.stderr)
        return 1

    if dep2 == dep and env2 == env:
        print(f"already pinned to {DIGEST} ({provenance})")
        return 0

    DEP.write_text(dep2)
    ENVF.write_text(env2)
    print(f"pinned storybook to {DIGEST} ({provenance})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
