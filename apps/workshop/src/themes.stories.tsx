import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, Button, Checkbox, Fieldset, Input, Surface, ToggleChip } from "@i258/ui";

const meta = {
  title: "Foundation/Themes",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/*
  Shaped like a triage screen rather than a generic card: a filter row of
  chips with mono counts over a dense list whose rows carry quiet status
  tags. Day and Night are one family at two exposures, so the thing worth
  comparing side by side is the same grammar, not two swatches. Rows are
  synthetic — no real register data in this public repo.
*/
const ROWS = [
  { id: "X-101", title: "Choose the retention window", tone: "accent" },
  { id: "X-102", title: "Review the migration plan", tone: "warning" },
  { id: "X-103", title: "Rollout under way", tone: "success" },
  { id: "X-104", title: "Front matter fails the schema", tone: "danger" },
] as const;

const TAG_LABEL = {
  accent: "decision",
  // Amber is only for what waits on you; blocked and unset are neutral.
  warning: "waiting on you",
  success: "in progress",
  danger: "schema error",
} as const;

function ThemeCard({ theme }: { theme: "light" | "dark" }) {
  return (
    <div
      data-theme={theme}
      style={{
        display: "grid",
        gap: 12,
        padding: 20,
        borderRadius: 12,
        background: "var(--i258-background)",
        color: "var(--i258-foreground)",
        fontFamily: "var(--i258-font-sans)",
        fontSize: 14,
        minWidth: 340,
        flex: "1 1 340px",
      }}
    >
      <div style={{ fontWeight: 600 }}>
        {theme === "light" ? "Day" : "Night"}
      </div>

      <Surface variant="default" padding="sm">
        <div style={{ display: "grid", gap: 8 }}>
          <Fieldset legend="Human required" emphasis="primary">
            <ToggleChip size="sm" pressed count={7}>
              decision
            </ToggleChip>
            <ToggleChip size="sm" count={4}>
              action
            </ToggleChip>
            <ToggleChip size="sm" count={12}>
              no
            </ToggleChip>
          </Fieldset>
          <Fieldset legend="Status">
            <ToggleChip size="sm" count={3}>
              blocked
            </ToggleChip>
            <ToggleChip size="sm" count={9}>
              in progress
            </ToggleChip>
          </Fieldset>
        </div>
      </Surface>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          border: "1px solid var(--i258-border)",
          borderRadius: "var(--i258-radius-lg)",
          overflow: "hidden",
        }}
      >
        {ROWS.map((row, i) => (
          <li
            key={row.id}
            style={{
              display: "grid",
              gridTemplateColumns: "4.5rem 1fr auto",
              gap: 12,
              alignItems: "center",
              padding: "8px 12px",
              background: "var(--i258-surface)",
              borderTop:
                i === 0 ? undefined : "1px solid var(--i258-border)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--i258-font-mono)",
                fontSize: 12,
                color: "var(--i258-accent-text)",
              }}
            >
              {row.id}
            </span>
            {/* Row title sits on foreground — accent is for interaction. */}
            <span style={{ fontWeight: 500 }}>{row.title}</span>
            <Badge variant={row.tone}>{TAG_LABEL[row.tone]}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const LightAndDark: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <ThemeCard theme="light" />
      <ThemeCard theme="dark" />
    </div>
  ),
};

/*
  The adjacency that list screens actually produce: controls sitting on a
  row at rest, hovered and selected. Every identifying edge here (input,
  checkbox, chip, the selected row's indicator bar) is held at 3:1 against
  the row it sits on by packages/ui/src/lib/contrast.test.ts; this story is
  the rendered check of the same thing, and axe audits its text.
*/
const ROW_STATES = [
  { state: "rest", background: "var(--i258-background)" },
  { state: "hover", background: "var(--i258-hover)" },
  { state: "selected", background: "var(--i258-selected)" },
] as const;

function RowsCard({ theme }: { theme: "light" | "dark" }) {
  return (
    <div
      data-theme={theme}
      style={{
        display: "grid",
        padding: 16,
        borderRadius: 12,
        background: "var(--i258-background)",
        color: "var(--i258-foreground)",
        fontFamily: "var(--i258-font-sans)",
        fontSize: "var(--i258-text-sm)",
        minWidth: 340,
        flex: "1 1 340px",
      }}
    >
      {ROW_STATES.map(({ state, background }, i) => (
        <div
          key={state}
          data-row-state={state}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxSizing: "border-box",
            minHeight: "var(--i258-row-height)",
            padding: "var(--i258-row-pad-y) 12px",
            background,
            borderTop: i === 0 ? undefined : "1px solid var(--i258-border)",
            boxShadow:
              state === "selected"
                ? "inset 2px 0 0 var(--i258-indicator)"
                : undefined,
          }}
        >
          <Checkbox aria-label={`Select ${state} row`} />
          <Checkbox aria-label={`Select ${state} row (checked)`} defaultChecked />
          <span style={{ width: 64, color: "var(--i258-muted)" }}>{state}</span>
          <ToggleChip size="sm">off</ToggleChip>
          <ToggleChip size="sm" pressed>
            on
          </ToggleChip>
          <Input size="sm" aria-label={`Note for ${state} row`} placeholder="Note" style={{ width: 96 }} />
          <Button size="sm" variant="secondary">
            Open
          </Button>
          <Badge variant="warning">blocked</Badge>
        </div>
      ))}
    </div>
  );
}

export const ControlsOnRows: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <RowsCard theme="light" />
      <RowsCard theme="dark" />
    </div>
  ),
};
