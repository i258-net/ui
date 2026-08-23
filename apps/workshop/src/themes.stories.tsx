import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Input, Surface } from "@i258/ui";

const meta = {
  title: "Foundation/Themes",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function ThemeCard({ theme }: { theme: "light" | "dark" }) {
  return (
    <div
      data-theme={theme}
      style={{
        padding: 24,
        borderRadius: 12,
        background: "var(--i258-background)",
        color: "var(--i258-foreground)",
        fontFamily: "var(--i258-font-sans)",
        minWidth: 280,
      }}
    >
      <Surface variant="raised" padding="md">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 600 }}>{theme} theme</div>
          <p style={{ margin: 0, color: "var(--i258-muted)", fontSize: 14 }}>
            Semantic tokens resolve under{" "}
            <code style={{ fontSize: 12 }}>data-theme=&quot;{theme}&quot;</code>
            .
          </p>
          <Input placeholder="Sample input" defaultValue="" />
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">
              Secondary
            </Button>
          </div>
        </div>
      </Surface>
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
