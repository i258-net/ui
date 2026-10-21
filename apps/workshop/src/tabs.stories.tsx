import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Tab, Tabs, TabsList, TabsPanel } from "@i258/ui";

/**
 * Views of one thing, on Base UI Tabs. ←/→ and Home/End move focus
 * along the strip (a disabled tab is focusable, never selected), Enter or
 * Space selects, Tab moves into the panel.
 * The selected tab is the 2px indicator bar plus foreground type, so it
 * isn't marked by colour alone.
 */
const meta = {
  title: "Primitives/Tabs",
  component: Tabs,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

function IssueTabs(props: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs defaultValue="overview" style={{ maxWidth: 560 }} {...props}>
      <TabsList aria-label="Issue X-19">
        <Tab value="overview">Overview</Tab>
        <Tab value="body">Body</Tab>
        <Tab value="log" count={12}>
          Log
        </Tab>
        <Tab value="prs" count={0} disabled>
          Pull requests
        </Tab>
      </TabsList>
      <TabsPanel value="overview" style={{ padding: "12px 0" }}>
        Status, owner and next action.
      </TabsPanel>
      <TabsPanel value="body" style={{ padding: "12px 0" }}>
        The issue's markdown.
      </TabsPanel>
      <TabsPanel value="log" style={{ padding: "12px 0" }}>
        Twelve entries.
      </TabsPanel>
      <TabsPanel value="prs" style={{ padding: "12px 0" }}>
        No pull requests.
      </TabsPanel>
    </Tabs>
  );
}

export const Default: Story = {
  render: () => <IssueTabs />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const list = c.getByRole("tablist", { name: "Issue X-19" });
    const overview = c.getByRole("tab", { name: "Overview" });
    const log = c.getByRole("tab", { name: "Log 12" });
    await expect(overview).toHaveAttribute("aria-selected", "true");
    await expect(c.getByRole("tabpanel")).toHaveTextContent("Status, owner and next action.");
    await expect(c.getByRole("tabpanel")).toHaveAccessibleName("Overview");
    await expect(list).toBeInTheDocument();

    // Arrows move focus only; Enter selects.
    await userEvent.click(overview);
    await userEvent.keyboard("{ArrowRight}");
    await expect(c.getByRole("tab", { name: "Body" })).toHaveFocus();
    await expect(overview).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}");
    await expect(log).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(log).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(c.getAllByRole("tabpanel")).toHaveLength(1));
    await expect(c.getByRole("tabpanel")).toHaveTextContent("Twelve entries.");

    // A disabled tab can be focused (so it is discoverable) but not selected.
    const prs = c.getByRole("tab", { name: "Pull requests 0" });
    await userEvent.keyboard("{ArrowRight}");
    await expect(prs).toHaveFocus();
    await expect(prs).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Enter}");
    await expect(log).toHaveAttribute("aria-selected", "true");
    // Wraps; Home and End reach the ends.
    await userEvent.keyboard("{ArrowRight}");
    await expect(overview).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(prs).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(overview).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(overview).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(c.getAllByRole("tabpanel")).toHaveLength(1));

    // Tab leaves the strip for the panel.
    await userEvent.tab();
    await expect(c.getByRole("tabpanel")).toHaveFocus();
  },
};

/** Log selected, nothing focused: for VRT. */
export const Selected: Story = {
  render: () => <IssueTabs defaultValue="log" />,
};

/** activateOnFocus: the panel follows focus. */
export const FollowsFocus: Story = {
  render: () => (
    <Tabs defaultValue="month" style={{ maxWidth: 560 }}>
      <TabsList aria-label="Period" activateOnFocus>
        <Tab value="month">Month</Tab>
        <Tab value="quarter">Quarter</Tab>
        <Tab value="year">Year</Tab>
      </TabsList>
      <TabsPanel value="month">This month</TabsPanel>
      <TabsPanel value="quarter">This quarter</TabsPanel>
      <TabsPanel value="year">This year</TabsPanel>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("tab", { name: "Month" }));
    await userEvent.keyboard("{ArrowRight}");
    await expect(c.getByRole("tab", { name: "Quarter" })).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(c.getAllByRole("tabpanel")).toHaveLength(1));
    await expect(c.getByRole("tabpanel")).toHaveTextContent("This quarter");
  },
};

/** Narrower than its tabs: the strip scrolls; the page doesn't. */
export const Overflow: Story = {
  render: () => (
    <div style={{ width: 240 }} data-testid="frame">
      <IssueTabs />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const frame = c.getByTestId("frame");
    const list = c.getByRole("tablist");
    await expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
    // Focus moving to an off-screen tab brings it into view.
    await userEvent.click(c.getByRole("tab", { name: "Overview" }));
    await userEvent.keyboard("{End}");
    const last = c.getByRole("tab", { name: "Pull requests 0" });
    await expect(last).toHaveFocus();
    const [l, t] = [list.getBoundingClientRect(), last.getBoundingClientRect()];
    await expect(t.right).toBeLessThanOrEqual(l.right + 1);
  },
};
