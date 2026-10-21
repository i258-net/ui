import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { SummaryStrip, SummaryTile } from "@i258/ui";

/**
 * Counts above a view. Each tile is a filter (a toggle button with
 * `aria-pressed`), a link, or a readout; the count leads its name. Amber
 * (`warning`) is only for what is waiting on you; blocked, unowned, drift
 * and stale are neutral, each with its own glyph. A tone shows only while
 * there is something to count. Pressed is an indicator edge plus a ✓ box.
 */
const meta = {
  title: "Patterns/SummaryStrip",
  component: SummaryStrip,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SummaryStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

const glyph = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  decision: glyph("M8 2.5v4M8 9.5v.01M3 13.5h10L8 2.5z"),
  action: glyph("M3 8h7M7.5 4.5 11 8l-3.5 3.5M13 3v10"),
  pr: glyph("M5 3v10M5 3a1.5 1.5 0 1 0 0 .01M11 13a1.5 1.5 0 1 0 0-.01M11 11.5V6a2 2 0 0 0-2-2H7"),
  unset: glyph("M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM6.5 6.5a1.5 1.5 0 1 1 2 1.4c-.4.2-.5.5-.5.9M8 11v.01"),
  unowned: glyph("M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 13.5c.5-2.5 2.5-3.5 5-3.5s4.5 1 5 3.5"),
  stale: glyph("M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM8 5v3l2 1.5"),
  problems: glyph("M8 2.5 14 13.5H2zM8 6.5v3M8 11.5v.01"),
  ledger: glyph("M3 3.5h10v9H3zM3 7h10M7 7v5.5"),
};

type Issue = { id: string; title: string; facets: string[] };
const ISSUES: Issue[] = [
  { id: "X-12", title: "Pick a retention window", facets: ["decision"] },
  { id: "X-14", title: "Rotate the staging key", facets: ["action", "stale"] },
  { id: "X-18", title: "Split the import job", facets: ["unowned", "unset"] },
  { id: "X-19", title: "Choose the export format", facets: ["decision", "unowned"] },
  { id: "X-23", title: "Archive old fixtures", facets: ["stale"] },
  { id: "X-27", title: "Name the new queue", facets: ["unset"] },
];

const TILES = [
  { key: "decision", label: "Decisions", caption: "waiting on you", tone: "warning" },
  { key: "action", label: "Actions", caption: "waiting on you", tone: "warning" },
  { key: "unset", label: "Unclassified", caption: "not triaged", tone: "neutral" },
  { key: "unowned", label: "Unowned", caption: undefined, tone: "neutral" },
  { key: "stale", label: "Stale", caption: "≥ 14 d", tone: "neutral" },
] as const;

/** Filter tiles over a list. Click or Space toggles; the pressed tile clears on a second press. */
export const Board: Story = {
  args: { label: "Board summary" },
  render: function Board() {
    const [filter, setFilter] = React.useState<string | null>(null);
    const rows = filter ? ISSUES.filter((i) => i.facets.includes(filter)) : ISSUES;
    return (
      <div style={{ display: "grid", gap: 16, maxWidth: 960 }}>
        <SummaryStrip label="Board summary">
          {TILES.map((t) => (
            <SummaryTile
              key={t.key}
              tone={t.tone}
              icon={Icons[t.key]}
              count={ISSUES.filter((i) => i.facets.includes(t.key)).length}
              label={t.label}
              caption={t.caption}
              pressed={filter === t.key}
              onClick={() => setFilter((f) => (f === t.key ? null : t.key))}
            />
          ))}
          <SummaryTile
            tone="warning"
            icon={Icons.pr}
            count={0}
            label="Pull requests"
            caption="waiting on you"
            render={<a href="#pull-requests" />}
          />
          <SummaryTile tone="danger" icon={Icons.problems} count={2} label="Data problems" caption="1 dup · 1 schema" pressed={false} />
        </SummaryStrip>
        <ul aria-label="Issues" style={{ margin: 0, paddingInlineStart: 20 }}>
          {rows.map((i) => (
            <li key={i.id}>
              {i.id} {i.title}
            </li>
          ))}
        </ul>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const strip = c.getByRole("region", { name: "Board summary" });
    const list = within(strip).getByRole("list");
    await expect(within(list).getAllByRole("listitem")).toHaveLength(7);
    const issues = () => within(c.getByRole("list", { name: "Issues" })).getAllByRole("listitem");
    await expect(issues()).toHaveLength(6);

    // The count leads the name; the glyph is not part of it.
    const decisions = c.getByRole("button", { name: "2 Decisions waiting on you" });
    await expect(decisions).toHaveAttribute("aria-pressed", "false");
    await expect(decisions).toHaveAttribute("type", "button");

    await userEvent.click(decisions);
    await expect(decisions).toHaveAttribute("aria-pressed", "true");
    await expect(issues()).toHaveLength(2);

    // Another tile replaces the filter; keyboard works the same.
    const stale = c.getByRole("button", { name: "2 Stale ≥ 14 d" });
    stale.focus();
    await userEvent.keyboard(" ");
    await expect(stale).toHaveAttribute("aria-pressed", "true");
    await expect(decisions).toHaveAttribute("aria-pressed", "false");
    await expect(issues().map((li) => li.textContent)).toEqual([
      "X-14 Rotate the staging key",
      "X-23 Archive old fixtures",
    ]);

    // Pressing the pressed tile clears it.
    await userEvent.keyboard("{Enter}");
    await expect(stale).toHaveAttribute("aria-pressed", "false");
    await expect(issues()).toHaveLength(6);

    // A link tile is a link, not a toggle; zero mutes its tone.
    const prs = c.getByRole("link", { name: "0 Pull requests waiting on you" });
    await expect(prs).not.toHaveAttribute("aria-pressed");
    await expect(prs).not.toHaveAttribute("type");
    await expect(prs).toHaveAttribute("data-zero");
    await expect(c.getByRole("button", { name: /^2 Data problems/ })).not.toHaveAttribute("data-zero");
  },
};

/** Board, with one filter on: for VRT. */
export const Pressed: Story = {
  args: { label: "Board summary" },
  render: () => (
    <div style={{ maxWidth: 960 }}>
      <SummaryStrip label="Board summary">
        <SummaryTile tone="warning" icon={Icons.decision} count={9} label="Decisions" caption="waiting on you" pressed />
        <SummaryTile tone="warning" icon={Icons.action} count={3} label="Actions" caption="waiting on you" pressed={false} />
        <SummaryTile tone="warning" icon={Icons.pr} count={0} label="Pull requests" caption="waiting on you" render={<a href="#pull-requests" />} />
        <SummaryTile icon={Icons.unset} count={4} label="Unclassified" caption="not triaged" pressed={false} />
        <SummaryTile icon={Icons.unowned} count={6} label="Unowned" pressed={false} />
        <SummaryTile icon={Icons.stale} count={5} label="Stale" caption="≥ 14 d" pressed={false} />
        <SummaryTile tone="danger" icon={Icons.problems} count={4} label="Data problems" caption="2 dup · 2 schema" pressed={false} />
      </SummaryStrip>
    </div>
  ),
};

/**
 * Abacus reuses the strip as region links. A passing check keeps its green
 * at zero (`alert`); a region that failed to load reads "—", never a fake
 * zero, and drops its tone.
 */
export const Abacus: Story = {
  args: { label: "Ledger summary" },
  render: () => (
    <div style={{ maxWidth: 960 }}>
      <SummaryStrip label="Ledger summary">
        <SummaryTile tone="success" alert icon={Icons.ledger} count={0} label="Ledger check" caption="passing" render={<a href="#check" />} />
        <SummaryTile icon={Icons.stale} count={2} label="Stale accounts" caption="≥ 30 d" render={<a href="#accounts" />} />
        <SummaryTile icon={Icons.unset} count={14} label="Uncategorized" caption="postings" render={<a href="#postings" />} />
        <SummaryTile icon={Icons.unowned} count="—" label="Unmapped payees" caption="failed to load" render={<a href="#payees" />} />
        <SummaryTile icon={Icons.action} count={1} label="Imports" caption="ready" render={<div />} />
      </SummaryStrip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getAllByRole("link")).toHaveLength(4);
    const check = c.getByRole("link", { name: "0 Ledger check passing" });
    await expect(check).not.toHaveAttribute("data-zero");
    // "—" is read as "Unknown", not as punctuation or a zero.
    const failed = c.getByRole("link", { name: "Unknown Unmapped payees failed to load" });
    await expect(failed).toHaveAttribute("data-zero");
    // A readout is neither a button nor a link.
    const imports = c.getByText("Imports").closest("[data-slot='summary-tile']")!;
    await expect(imports.tagName).toBe("DIV");
    await expect(imports).not.toHaveAttribute("type");
  },
};

/**
 * A passing check whose next load fails: the count becomes "—" and the
 * green goes with it, `alert` or not. Unknown never keeps a tone.
 */
export const CheckGoesUnknown: Story = {
  args: { label: "Ledger summary" },
  render: function CheckGoesUnknown() {
    const [failed, setFailed] = React.useState(false);
    return (
      <div style={{ display: "grid", gap: 16, maxWidth: 960, justifyItems: "start" }}>
        <SummaryStrip label="Ledger summary">
          <SummaryTile
            tone="success"
            alert
            icon={Icons.ledger}
            count={failed ? "—" : 0}
            label="Ledger check"
            caption={failed ? "failed to load" : "passing"}
            render={<a href="#check" />}
          />
          <SummaryTile icon={Icons.stale} count={0} label="Stale accounts" render={<a href="#accounts" />} />
        </SummaryStrip>
        <button type="button" onClick={() => setFailed(true)}>
          Reload
        </button>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const countColor = (el: HTMLElement) =>
      getComputedStyle(el.querySelector(".i258-summary-tile__count")!).color;
    const quiet = countColor(c.getByRole("link", { name: "0 Stale accounts" }));
    const passing = c.getByRole("link", { name: "0 Ledger check passing" });
    await expect(passing).not.toHaveAttribute("data-zero");
    await expect(countColor(passing)).not.toBe(quiet);

    await userEvent.click(c.getByRole("button", { name: "Reload" }));
    const unknown = c.getByRole("link", { name: "Unknown Ledger check failed to load" });
    await expect(unknown).toHaveAttribute("data-zero");
    await expect(countColor(unknown)).toBe(quiet);
  },
};

/**
 * Tiles inside a form: neither the default tile nor one rendered as a
 * custom `<button>` with `type="button"` submits it.
 */
export const InForm: Story = {
  args: { label: "Filters" },
  render: function InForm() {
    const [submits, setSubmits] = React.useState(0);
    const [pressed, setPressed] = React.useState<string | null>(null);
    const toggle = (key: string) => () => setPressed((p) => (p === key ? null : key));
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmits((n) => n + 1);
        }}
        style={{ display: "grid", gap: 16, maxWidth: 960, justifyItems: "start" }}
      >
        <SummaryStrip label="Filters">
          <SummaryTile
            tone="warning"
            icon={Icons.decision}
            count={9}
            label="Decisions"
            pressed={pressed === "decision"}
            onClick={toggle("decision")}
          />
          <SummaryTile
            icon={Icons.stale}
            count={5}
            label="Stale"
            render={<button className="custom" />}
            type="button"
            pressed={pressed === "stale"}
            onClick={toggle("stale")}
          />
        </SummaryStrip>
        <output aria-label="Submits">{submits}</output>
      </form>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const submits = c.getByRole("status", { name: "Submits" });
    const custom = c.getByRole("button", { name: "5 Stale" });
    const plain = c.getByRole("button", { name: "9 Decisions" });
    await expect(custom).toHaveClass("custom");

    // Click, Enter and Space toggle the tile and never submit the form.
    await userEvent.click(custom);
    await expect(custom).toHaveAttribute("aria-pressed", "true");
    await expect(submits).toHaveTextContent("0");
    await userEvent.keyboard("{Enter}");
    await expect(custom).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard(" ");
    await expect(custom).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(plain);
    await expect(plain).toHaveAttribute("aria-pressed", "true");
    await expect(submits).toHaveTextContent("0");
    await expect(custom).toHaveAttribute("type", "button");
    await expect(plain).toHaveAttribute("type", "button");
  },
};

/** Two columns at 320px; nothing scrolls sideways. */
export const Narrow: Story = {
  args: { label: "Board summary" },
  render: () => (
    <div style={{ width: 288 }} data-testid="frame">
      <SummaryStrip label="Board summary">
        <SummaryTile tone="warning" icon={Icons.decision} count={9} label="Decisions" caption="waiting on you" pressed={false} />
        <SummaryTile tone="warning" icon={Icons.action} count={3} label="Actions" caption="waiting on you" pressed={false} />
        <SummaryTile icon={Icons.unset} count={4} label="Unclassified" pressed={false} />
        <SummaryTile icon={Icons.stale} count={5} label="Stale" caption="≥ 14 d" pressed={false} />
      </SummaryStrip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    const strip = frame.querySelector("section")!;
    await expect(strip.scrollWidth).toBeLessThanOrEqual(strip.clientWidth);
    const tops = [...frame.querySelectorAll("li")].map((li) => Math.round(li.getBoundingClientRect().top));
    await expect(tops[0]).toBe(tops[1]);
    await expect(tops[2]).toBeGreaterThan(tops[0]!);
  },
};

/** The compact density set shrinks tile padding and the count. */
export const Compact: Story = {
  args: { label: "Board summary" },
  render: () => (
    <div style={{ display: "grid", gap: 16, maxWidth: 960 }}>
      {(["comfortable", "compact"] as const).map((d) => (
        <div key={d} data-density={d} data-testid={d}>
          <SummaryStrip label={`Board summary (${d})`}>
            <SummaryTile tone="warning" icon={Icons.decision} count={9} label="Decisions" caption="waiting on you" pressed={false} />
            <SummaryTile icon={Icons.stale} count={5} label="Stale" caption="≥ 14 d" pressed={false} />
          </SummaryStrip>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const h = (d: string) =>
      within(c.getByTestId(d)).getAllByRole("button")[0]!.getBoundingClientRect().height;
    await expect(h("compact")).toBeLessThan(h("comfortable"));
  },
};
