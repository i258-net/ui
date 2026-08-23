import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src", "styles");
const dist = join(root, "dist");

await mkdir(dist, { recursive: true });

const tokens = await readFile(join(src, "tokens.css"), "utf8");
const themes = await readFile(join(src, "themes.css"), "utf8");
const components = await readFile(join(src, "components.css"), "utf8");

await copyFile(join(src, "tokens.css"), join(dist, "tokens.css"));
await writeFile(
  join(dist, "styles.css"),
  [tokens, themes, components].join("\n"),
  "utf8",
);

console.log("wrote dist/tokens.css and dist/styles.css");
