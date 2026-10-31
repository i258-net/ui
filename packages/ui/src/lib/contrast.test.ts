import { describe, expect, it } from "vitest";

import themesSource from "../styles/themes.css?raw";

/*
  WCAG 2.x contrast for every pairing the kit's components rely on, computed
  from themes.css itself rather than from a copy of its values.

  The adjacent surfaces are the page ladder plus the two row states
  (--i258-hover, --i258-selected), because list rows put controls on those:
  a checkbox, a toggle chip or an input inside a selected row has to keep its
  identifying edge at 3:1 against the row, not just against the page.
  Washes are recomputed the way the CSS mixes them (color-mix in srgb over
  --i258-surface).
*/

type Theme = Record<string, string>;

// Comments mention token names ("Not --i258-accent: …"); drop them first.
const themesCss = themesSource.replace(/\/\*[\s\S]*?\*\//g, "");

function block(selector: string): Theme {
  const start = themesCss.indexOf(selector);
  if (start < 0) throw new Error(`themes.css has no block for ${selector}`);
  const open = themesCss.indexOf("{", start);
  const close = themesCss.indexOf("}", open);
  const out: Theme = {};
  for (const m of themesCss.slice(open + 1, close).matchAll(/--i258-([a-z0-9-]+):\s*([^;]+);/g)) {
    out[m[1]!] = m[2]!.trim();
  }
  return out;
}

const light = block(':root,\n[data-theme="light"]');
const darkMedia = block(':root:not([data-theme="light"])');
const dark = block('[data-theme="dark"] {');

const rgb = (hex: string) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`not a #rrggbb colour: ${hex}`);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
};
const toHex = (c: number[]) =>
  `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
/** color-mix(in srgb, a p, b): interpolates the gamma-encoded channels. */
const mix = (a: string, p: number, b: string) => {
  const [x, y] = [rgb(a), rgb(b)];
  return toHex(x.map((v, i) => v * p + y[i]! * (1 - p)));
};
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (hi! + 0.05) / (lo! + 0.05);
};
const percent = (v: string | undefined) => {
  const m = /^(\d+(?:\.\d+)?)%$/.exec(v ?? "");
  if (!m) throw new Error(`not a percentage: ${v}`);
  return Number(m[1]) / 100;
};

/** Token names for the test title; resolved colours for the ratio. */
type Pair = {
  fg: string;
  bg: string;
  fgValue: string;
  bgValue: string;
  min: number;
};

function pairs(t: Theme): Pair[] {
  const c = (name: string) => {
    const v = t[name];
    if (!v) throw new Error(`theme has no --i258-${name}`);
    return v;
  };
  const tint = percent(t["tint-mix"]);
  const chip = percent(t["chip-selected-mix"]);
  const surfaces = ["background", "surface", "surface-raised", "hover", "selected"];
  const out: Pair[] = [];
  const on = (fg: string, bgs: Record<string, string>, min: number) => {
    for (const [bg, value] of Object.entries(bgs)) {
      out.push({ fg, bg, fgValue: c(fg), bgValue: value, min });
    }
  };
  const ladder = Object.fromEntries(surfaces.map((s) => [s, c(s)]));
  const wash = (tone: string, p: number) => mix(c(tone), p, c("surface"));

  // Type on the page ladder and on row states.
  on("foreground", ladder, 4.5);
  on("muted", ladder, 4.5);
  // Accent as type: links, pressed chip/choice labels, accent badge.
  on(
    "accent-text",
    {
      ...ladder,
      "pressed chip wash": wash("accent", chip),
      "accent tint wash": wash("accent", tint),
    },
    4.5,
  );
  for (const tone of ["danger", "warning", "success"]) {
    // Inline errors, quiet tags, status words.
    on(`${tone}-text`, { ...ladder, [`${tone} tint wash`]: wash(tone, tint) }, 4.5);
    // Label on a filled control.
    on(`${tone}-foreground`, { [tone]: c(tone) }, 4.5);
  }
  on("accent-foreground", { accent: c("accent"), "accent-hover": c("accent-hover") }, 4.5);
  on("danger-foreground", { "danger-hover": c("danger-hover") }, 4.5);
  // Alert body copy stays foreground on every tone's wash.
  on(
    "foreground",
    Object.fromEntries(
      ["accent", "success", "warning", "danger"].map((tone) => [
        `${tone} tint wash`,
        wash(tone, tint),
      ]),
    ),
    4.5,
  );

  // Non-text (WCAG 1.4.11): edges that identify a control or a state.
  on("border-strong", ladder, 3);
  on("indicator", ladder, 3);
  on("focus-ring", { ...ladder, "pressed chip wash": wash("accent", chip) }, 3);
  // Invalid input / checkbox edge.
  on("danger", ladder, 3);
  // Checkbox tick on its fill.
  on("accent-foreground", { accent: c("accent") }, 3);
  // The ✓ in a pressed toggle chip's box and a pressed summary tile's box
  // (the glyph is the page colour on the indicator fill), held to the text
  // ratio because it is a character.
  on("background", { indicator: c("indicator") }, 4.5);
  return out;
}

describe.each([
  ["Day (light)", light],
  ["Night (dark)", dark],
])("%s contrast", (_name, theme) => {
  const rows = pairs(theme).map((p) => ({
    ...p,
    r: Number(ratio(p.fgValue, p.bgValue).toFixed(2)),
  }));

  it.each(rows)("$fg on $bg ≥ $min ($r)", ({ r, min }) => {
    expect(r).toBeGreaterThanOrEqual(min);
  });
});

describe("themes.css", () => {
  it("states the same Night values for prefers-color-scheme and data-theme", () => {
    expect(darkMedia).toEqual(dark);
  });

  it("defines every Day token in Night", () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });

  it("keeps the decorative hairline below the strong control border", () => {
    for (const t of [light, dark]) {
      expect(ratio(t["border"]!, t["background"]!)).toBeLessThan(
        ratio(t["border-strong"]!, t["background"]!),
      );
    }
  });
});
