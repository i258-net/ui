import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { StatusLabel } from "@i258/ui";

/**
 * A status as glyph + word, colour on the status only. The app maps its
 * values to tones. Amber (`warning`) means waiting on you, nothing else:
 * blocked, missing priority and drift are `neutral` / `muted` with their
 * own glyph.
 */
const meta = {
  title: "Primitives/StatusLabel",
  component: StatusLabel,
  args: { children: "In progress", tone: "accent" },
  parameters: {
    controls: { include: ["children", "tone", "size", "tinted"] },
  },
  argTypes: {
    tone: {
      control: "select",
      options: ["neutral", "muted", "accent", "success", "warning", "danger"],
    },
    size: { control: "select", options: ["sm", "md"] },
    tinted: { control: "boolean" },
  },
} satisfies Meta<typeof StatusLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

const glyph = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  open: glyph("M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"),
  progress: glyph("M8 13.5a5.5 5.5 0 1 0 0-11M8 5v3l2 1.5"),
  done: glyph("M3.5 8.5 6.5 11.5 12.5 4.5"),
  waiting: glyph("M8 2.5v4M8 9.5v.01M3 13.5h10L8 2.5z"),
  blocked: glyph("M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM4.2 11.8l7.6-7.6"),
  drift: glyph("M2.5 10c2-3 4-3 5.5 0s3.5 3 5.5 0"),
  failed: glyph("M4 4l8 8M12 4l-8 8"),
};

export const Default: Story = {
  args: { icon: Icons.progress },
};

const TONES = [
  { tone: "neutral", label: "Open", icon: Icons.open },
  { tone: "accent", label: "In progress", icon: Icons.progress },
  { tone: "success", label: "Done", icon: Icons.done },
  { tone: "warning", label: "Waiting on you", icon: Icons.waiting },
  { tone: "neutral", label: "Blocked", icon: Icons.blocked },
  { tone: "muted", label: "Drift", icon: Icons.drift },
  { tone: "danger", label: "Schema error", icon: Icons.failed },
] as const;

/** Every tone, plain and tinted, at both sizes. */
export const Tones: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      {([false, true] as const).map((tinted) =>
        (["md", "sm"] as const).map((size) => (
          <div key={`${tinted}-${size}`} style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
            {TONES.map((t) => (
              <StatusLabel key={t.label} tone={t.tone} icon={t.icon} size={size} tinted={tinted}>
                {t.label}
              </StatusLabel>
            ))}
          </div>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const labels = c.getAllByText("Blocked");
    await expect(labels).toHaveLength(4);
    // The glyph is decorative; the word is the whole accessible text.
    const label = labels[0]!.closest("[data-slot='status-label']")!;
    await expect(label.querySelector(".i258-status__icon")).toHaveAttribute("aria-hidden", "true");
    await expect(label).toHaveTextContent(/^Blocked$/);
    // Blocked is not amber: only "waiting on you" is.
    const colour = (text: string) => getComputedStyle(c.getAllByText(text)[0]!).color;
    await expect(colour("Blocked")).not.toBe(colour("Waiting on you"));
    await expect(colour("Blocked")).toBe(colour("Open"));
    const tinted = c.getAllByText("Done")[2]!.closest("[data-slot='status-label']")!;
    await expect(tinted).toHaveAttribute("data-tinted");
  },
};

/** In a narrow cell the word truncates; the full text is still the content. */
export const Truncated: Story = {
  render: () => (
    <div style={{ width: 120 }} data-testid="cell">
      <StatusLabel tone="warning" icon={Icons.waiting}>
        Waiting on you since Monday
      </StatusLabel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cell = within(canvasElement).getByTestId("cell");
    const label = cell.querySelector<HTMLElement>(".i258-status__label")!;
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    await expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth);
    await expect(label).toHaveTextContent("Waiting on you since Monday");
  },
};
