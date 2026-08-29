#!/usr/bin/env node
/**
 * Fail if package.json `exports` do not match what `pnpm pack` ships, then
 * smoke-import the packed tarball. Catches dangling .js/.mjs mismatches that
 * typecheck/Storybook miss (workshop imports src; tsc only needs .d.ts).
 *
 * Usage: run after `pnpm build` from packages/ui (or via `pnpm pack:verify`).
 */
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"));

function collectExportTargets(exportsField, out = []) {
  if (typeof exportsField === "string") {
    out.push(exportsField);
    return out;
  }
  if (!exportsField || typeof exportsField !== "object") return out;
  for (const value of Object.values(exportsField)) {
    collectExportTargets(value, out);
  }
  return out;
}

const exportPaths = collectExportTargets(pkg.exports)
  .filter((p) => typeof p === "string" && p.startsWith("./"))
  .map((p) => p.slice(2));

if (exportPaths.length === 0) {
  console.error("pack-verify: no export paths found in package.json");
  process.exit(1);
}

const pack = spawnSync("pnpm", ["pack", "--pack-destination", tmpdir()], {
  cwd: pkgRoot,
  encoding: "utf8",
});
if (pack.status !== 0) {
  console.error(pack.stdout || "");
  console.error(pack.stderr || "");
  process.exit(pack.status ?? 1);
}

const tarball = (pack.stdout || "")
  .trim()
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .at(-1);
if (!tarball || !tarball.endsWith(".tgz")) {
  console.error("pack-verify: could not find tarball path in pnpm pack output:");
  console.error(pack.stdout);
  process.exit(1);
}

const list = spawnSync("tar", ["-tzf", tarball], { encoding: "utf8" });
if (list.status !== 0) {
  console.error(list.stderr || "");
  process.exit(list.status ?? 1);
}
const packedFiles = new Set(
  (list.stdout || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^package\//, "")),
);

const missing = exportPaths.filter((rel) => !packedFiles.has(rel));
if (missing.length) {
  console.error(
    "pack-verify: package.json exports point at files missing from the tarball:",
  );
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), "i258-ui-resolve-"));
try {
  writeFileSync(
    join(work, "package.json"),
    JSON.stringify(
      {
        name: "i258-ui-pack-verify",
        private: true,
        type: "module",
        dependencies: {
          "@i258/ui": `file:${tarball}`,
          react: "^19.0.0",
          "react-dom": "^19.0.0",
        },
      },
      null,
      2,
    ),
  );

  const install = spawnSync("npm", ["install", "--no-package-lock"], {
    cwd: work,
    encoding: "utf8",
  });
  if (install.status !== 0) {
    console.error(install.stdout || "");
    console.error(install.stderr || "");
    process.exit(install.status ?? 1);
  }

  const smoke = join(work, "smoke.mjs");
  writeFileSync(
    smoke,
    `import * as ui from "@i258/ui";
const keys = Object.keys(ui);
if (keys.length === 0) {
  console.error("pack-verify: @i258/ui imported with zero exports");
  process.exit(1);
}
console.log("pack-verify: import ok (" + keys.length + " exports)");
`,
  );

  const run = spawnSync(process.execPath, [smoke], {
    cwd: work,
    encoding: "utf8",
  });
  if (run.status !== 0) {
    console.error(run.stdout || "");
    console.error(run.stderr || "");
    process.exit(run.status ?? 1);
  }
  process.stdout.write(run.stdout || "");
  console.log(
    `pack-verify: ok — ${exportPaths.length} export paths present in ${tarball}`,
  );
} finally {
  rmSync(work, { recursive: true, force: true });
  rmSync(tarball, { force: true });
}
