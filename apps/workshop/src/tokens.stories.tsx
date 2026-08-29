import type { Meta, StoryObj } from "@storybook/react-vite";

const semanticColors = [
  "background",
  "surface",
  "surface-raised",
  "foreground",
  "muted",
  "border",
  "accent",
  "accent-foreground",
  "danger",
  "danger-foreground",
  "warning",
  "success",
  "focus-ring",
] as const;

const typeScale = ["xs", "sm", "md", "lg"] as const;
const spaceScale = ["1", "2", "3", "4", "6", "8"] as const;
const radiusScale = ["sm", "md", "lg", "full"] as const;

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

export const SemanticColor: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 16,
      }}
    >
      {semanticColors.map((name) => (
        <Swatch key={name} name={name} />
      ))}
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
        <div
          key={step}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
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
          <div style={{ fontSize: 12, marginTop: 8, fontFamily: "monospace" }}>
            {step}
          </div>
        </div>
      ))}
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
