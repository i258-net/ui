import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

/*
  Grouped the way the tokens are meant to be reached for:
  - surfaces + type: the page ladder,
  - tone fills (`--i258-<tone>`) + their `-foreground`: filled controls only,
  - tone text (`--i258-<tone>-text`): the tone as *type*, on a page, a surface
    or a soft wash — this is what quiet tags and inline errors use,
  - `-hover`: the filled-control hover step for this exposure.
*/
const surfaceColors = [
  "background",
  "surface",
  "surface-raised",
  "hover",
  "selected",
  "foreground",
  "muted",
] as const;

/*
  Two border weights: `border` is a decorative hairline (below 3:1 on
  purpose); `border-strong` is a control's identifying edge and `indicator`
  marks pressed/current state — both 3:1 on every surface above.
*/
const edgeColors = ["border", "border-strong", "indicator", "focus-ring"] as const;

const toneColors = [
  "accent",
  "accent-foreground",
  "accent-text",
  "accent-hover",
  "danger",
  "danger-foreground",
  "danger-text",
  "danger-hover",
  "warning",
  "warning-foreground",
  "warning-text",
  "success",
  "success-foreground",
  "success-text",
] as const;

const typeScale = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"] as const;
const spaceScale = ["1", "2", "3", "4", "5", "6", "8", "10"] as const;
const radiusScale = ["sm", "md", "lg", "xl", "full"] as const;
const controlScale = [
  "control-xs",
  "control-sm",
  "control-md",
  "control-lg",
  "input-height",
] as const;
const densityScale = [
  "control-sm",
  "control-md",
  "control-lg",
  "input-height",
  "row-height",
  "row-pad-y",
  "cell-pad-y",
  "pane-pad-x",
  "pane-pad-y",
  "pane-gap",
] as const;

function Swatch({ name }: { name: string }) {
  const varName = `--i258-${name}`;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          height: 56,
          borderRadius: 8,
          border: "1px solid var(--i258-border)",
          background: `var(${varName})`,
        }}
      />
      <div style={{ fontSize: 12, fontFamily: "var(--i258-font-mono)" }}>
        <div>{name}</div>
        <div style={{ color: "var(--i258-muted)" }}>{varName}</div>
      </div>
    </div>
  );
}

const meta = {
  title: "Foundation/Tokens",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function SwatchGrid({ names }: { names: readonly string[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 16,
      }}
    >
      {names.map((name) => (
        <Swatch key={name} name={name} />
      ))}
    </div>
  );
}

function GroupHeading({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--i258-font-sans)",
        fontSize: "var(--i258-text-sm)",
        fontWeight: 600,
        color: "var(--i258-foreground)",
      }}
    >
      {children}
    </div>
  );
}

export const SemanticColor: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      <GroupHeading>Surfaces, row states and type</GroupHeading>
      <SwatchGrid names={surfaceColors} />
      <GroupHeading>Edges — decorative hairline, control border, indicator</GroupHeading>
      <SwatchGrid names={edgeColors} />
      <GroupHeading>Tones — fill, its foreground, text, hover</GroupHeading>
      <SwatchGrid names={toneColors} />
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      {typeScale.map((size) => (
        <div key={size}>
          <div
            style={{
              fontSize: 12,
              color: "var(--i258-muted)",
              fontFamily: "var(--i258-font-mono)",
              marginBottom: 4,
            }}
          >
            --i258-text-{size}
          </div>
          <div
            style={{
              fontSize: `var(--i258-text-${size})`,
              lineHeight: "var(--i258-leading-normal)",
              fontFamily: "var(--i258-font-sans)",
            }}
          >
            The quick brown fox jumps over the lazy dog.
          </div>
        </div>
      ))}
      <div
        style={{
          fontFamily: "var(--i258-font-mono)",
          fontSize: "var(--i258-text-sm)",
        }}
      >
        Mono: const tokens = &quot;--i258-*&quot;;
      </div>
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      {spaceScale.map((step) => (
        <div key={step} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <code style={{ width: 120, fontSize: 12 }}>--i258-space-{step}</code>
          <div
            style={{
              height: 12,
              width: `var(--i258-space-${step})`,
              background: "var(--i258-accent)",
              borderRadius: 2,
            }}
          />
        </div>
      ))}
    </div>
  ),
};

export const Radius: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {radiusScale.map((step) => (
        <div key={step} style={{ textAlign: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              background: "var(--i258-surface)",
              border: "1px solid var(--i258-border)",
              borderRadius: `var(--i258-radius-${step})`,
              boxShadow: "var(--i258-shadow-sm)",
            }}
          />
          <div style={{ fontSize: 12, marginTop: 8, fontFamily: "monospace" }}>{step}</div>
        </div>
      ))}
    </div>
  ),
};

function ControlBars({ density }: { density: "comfortable" | "compact" }) {
  return (
    <div data-density={density} style={{ display: "grid", gap: 8 }}>
      <GroupHeading>data-density=&quot;{density}&quot;</GroupHeading>
      {controlScale.map((step) => (
        <div key={step} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <code style={{ width: 160, fontSize: 12 }}>--i258-{step}</code>
          <div
            style={{
              width: 48,
              height: `var(--i258-${step})`,
              background: "var(--i258-surface-raised)",
              border: "1px solid var(--i258-border-strong)",
              borderRadius: "var(--i258-radius-md)",
            }}
          />
        </div>
      ))}
      <div
        style={{
          border: "1px solid var(--i258-border)",
          borderRadius: "var(--i258-radius-lg)",
          overflow: "hidden",
        }}
      >
        {["First row", "Second row", "Third row"].map((label, i) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              boxSizing: "border-box",
              minHeight: "var(--i258-row-height)",
              padding: "var(--i258-row-pad-y) var(--i258-pane-pad-x)",
              borderTop: i === 0 ? undefined : "1px solid var(--i258-border)",
              background: i === 1 ? "var(--i258-selected)" : undefined,
              boxShadow: i === 1 ? "inset 2px 0 0 var(--i258-indicator)" : undefined,
              fontFamily: "var(--i258-font-sans)",
              fontSize: "var(--i258-text-sm)",
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/*
  Density is a token switch, not a component prop: `data-density="compact"`
  on any ancestor swaps the whole set at once. These are the tokens it moves.
*/
export const Density: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        <ControlBars density="comfortable" />
        <ControlBars density="compact" />
      </div>
      <code style={{ fontSize: 12, color: "var(--i258-muted)" }}>
        Moves together: {densityScale.map((t) => `--i258-${t}`).join(", ")}
      </code>
    </div>
  ),
};

export const Elevation: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      {(["sm", "md"] as const).map((level) => (
        <div
          key={level}
          style={{
            width: 160,
            height: 96,
            borderRadius: "var(--i258-radius-lg)",
            background: "var(--i258-surface)",
            boxShadow: `var(--i258-shadow-${level})`,
            display: "grid",
            placeItems: "center",
            fontSize: 13,
          }}
        >
          --i258-shadow-{level}
        </div>
      ))}
    </div>
  ),
};
