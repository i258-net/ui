import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const styles = join(root, "src", "styles");
const dist = join(root, "dist");

await mkdir(dist, { recursive: true });

function runCli(input, output) {
  const result = spawnSync(
    "pnpm",
    ["exec", "tailwindcss", "-i", input, "-o", output, "--minify"],
    {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    process.exit(result.status ?? 1);
  }
  process.stdout.write(result.stderr ?? result.stdout ?? "");
}

runCli(join(styles, "entry.css"), join(dist, "styles.css"));
runCli(join(styles, "tokens.entry.css"), join(dist, "tokens.css"));
console.log("wrote dist/styles.css and dist/tokens.css via tailwindcss CLI");
