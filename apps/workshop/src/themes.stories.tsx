import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, Fieldset, Surface, ToggleChip } from "@i258/ui";

const meta = {
  title: "Foundation/Themes",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/*
  Deliberately shaped like a Honeycomb triage screen rather than a generic
  card: a filter row of chips with mono counts over a dense list whose rows
  carry quiet status tags. Day and Night are one family at two exposures, so
  the thing worth comparing side by side is the same grammar, not two
  swatches.
*/
const ROWS = [
  { id: "I25-146", title: "Roster answer supersedes the removal", tone: "accent" },
  { id: "I25-161", title: "Root install done, blocked on seat reset", tone: "warning" },
  { id: "I25-175", title: "Digest bump lands from the CI App", tone: "success" },
  { id: "I25-116", title: "Register entry contradicts live state", tone: "danger" },
] as const;

const TAG_LABEL = {
  accent: "decision",
  warning: "blocked",
  success: "in progress",
  danger: "unset",
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
        Tokyo {theme === "light" ? "Day" : "Night"}
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
