import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert, Badge, Button, Input, Surface } from "@i258/ui";

/**
 * Raised / inverted context lives in composition stories — never as global
 * decorator chrome (see Phase 1 / ui#39 ThemeHost thinning).
 */
const meta = {
  title: "Foundation/Composition",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        minWidth: 360,
        maxWidth: 480,
        padding: 20,
        borderRadius: "var(--i258-radius-lg)",
        background: "var(--i258-background)",
        color: "var(--i258-foreground)",
        fontFamily: "var(--i258-font-sans)",
        border: "1px solid var(--i258-border)",
      }}
    >
      {children}
    </div>
  );
}

export const RaisedOnPage: Story = {
  name: "Raised on page",
  render: () => (
    <PageFrame>
      <div style={{ fontSize: 13, color: "var(--i258-muted)" }}>
        Page = <code>--i258-background</code>. Card ={" "}
        <code>Surface raised</code> — not a decorator island.
      </div>
      <Surface variant="raised" padding="lg">
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong>Raised context</strong>
            <Badge variant="accent">demo</Badge>
          </div>
          <Input placeholder="Field on raised surface" />
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">
              Secondary
            </Button>
          </div>
        </div>
      </Surface>
      <Alert tone="info" title="On the page">
        Alerts and filters sit on the page token, not inside every story host.
      </Alert>
    </PageFrame>
  ),
};

export const InvertedChrome: Story = {
  name: "Inverted chrome",
  render: (_args, context) => {
    const theme = (context.globals.theme as string) ?? "light";
    const inverted = theme === "dark" ? "light" : "dark";
    return (
      <PageFrame>
        <div style={{ fontSize: 13, color: "var(--i258-muted)" }}>
          Nested <code>data-theme=&quot;{inverted}&quot;</code> strip — inverted
          chrome is composition, not global decorator paint.
        </div>
        <div
          data-theme={inverted}
          style={{
            display: "grid",
            gap: 12,
            padding: 16,
            borderRadius: "var(--i258-radius-md)",
            background: "var(--i258-background)",
            color: "var(--i258-foreground)",
            fontFamily: "var(--i258-font-sans)",
            border: "1px solid var(--i258-border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong>Inverted shell</strong>
            <Badge variant="neutral">chrome</Badge>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "var(--i258-muted)" }}>
            Buttons and badges inherit the nested theme tokens.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">
              Secondary
            </Button>
            <Button size="sm" variant="ghost">
              Ghost
            </Button>
          </div>
        </div>
        <Surface variant="raised" padding="md">
          <span style={{ fontSize: 14 }}>
            Raised surface stays on the outer theme — only the strip inverted.
          </span>
        </Surface>
      </PageFrame>
    );
  },
};

export const AccentChrome: Story = {
  name: "Accent chrome",
  render: () => (
    <PageFrame>
      <div style={{ fontSize: 13, color: "var(--i258-muted)" }}>
        Accent band uses <code>--i258-accent</code> /{" "}
        <code>--i258-accent-foreground</code> — another composition surface,
        not a ThemeHost.
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
          borderRadius: "var(--i258-radius-md)",
          background: "var(--i258-accent)",
          color: "var(--i258-accent-foreground)",
          fontFamily: "var(--i258-font-sans)",
        }}
      >
        <strong style={{ fontSize: 14 }}>Accent chrome</strong>
        <Badge
          variant="neutral"
          style={{
            background: "var(--i258-accent-foreground)",
            color: "var(--i258-accent)",
            borderColor: "transparent",
          }}
        >
          live
        </Badge>
      </div>
      <Surface variant="default" padding="md">
        <span style={{ fontSize: 14, color: "var(--i258-muted)" }}>
          Default surface under the band — page hierarchy without decorator
          chrome.
        </span>
      </Surface>
    </PageFrame>
  ),
};
