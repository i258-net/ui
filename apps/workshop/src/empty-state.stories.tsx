import { Button, EmptyState } from "@i258/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

/**
 * Nothing here, no results, stale and failed-to-load: one panel shape for
 * every system state. The tone colours the glyph only; the title says what
 * happened and the actions say what to do.
 */
const meta = {
  title: "Primitives/EmptyState",
  component: EmptyState,
  parameters: { layout: "padded" },
  args: { title: "No issues yet" },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

const glyph = (d: string) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);
const InboxIcon = () => glyph("M2.5 9.5 4 3.5h8l1.5 6v3h-11zM2.5 9.5h3.5l.5 1.5h3l.5-1.5h3.5");
const SearchIcon = () => glyph("M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM10.5 10.5 14 14");
const ClockIcon = () => glyph("M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM8 5v3l2 1.5");
const AlertIcon = () => glyph("M8 2.5 14 13.5H2zM8 6.5v3M8 11.5v.01");

export const Empty: Story = {
  args: {
    icon: <InboxIcon />,
    title: "No issues yet",
    children: <p>Issues you file show up here.</p>,
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByRole("heading", { level: 2, name: "No issues yet" })).toBeInTheDocument();
    const icon = canvasElement.querySelector(".i258-empty__icon");
    await expect(icon).toHaveAttribute("aria-hidden", "true");
  },
};

/** No results: the action puts the user back where results are. */
export const NoResults: Story = {
  render: function NoResults() {
    const [cleared, setCleared] = React.useState(false);
    return cleared ? (
      <p>Showing all 40 issues.</p>
    ) : (
      <EmptyState
        icon={<SearchIcon />}
        headingLevel={3}
        title="No issues match these filters"
        actions={
          <Button variant="secondary" size="sm" onClick={() => setCleared(true)}>
            Clear filters
          </Button>
        }
      >
        <p>Status: Blocked · Owner: Unowned</p>
      </EmptyState>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByRole("heading", { level: 3 })).toHaveTextContent(
      "No issues match these filters",
    );
    await userEvent.click(c.getByRole("button", { name: "Clear filters" }));
    await expect(c.getByText("Showing all 40 issues.")).toBeInTheDocument();
  },
};

/** Stale data: amber may stay here (it affects trust in everything shown). */
export const Stale: Story = {
  args: {
    tone: "warning",
    icon: <ClockIcon />,
    title: "This data is 3 days old",
    children: <p>The last sync failed. What you see may be out of date.</p>,
    actions: (
      <Button variant="secondary" size="sm">
        Sync now
      </Button>
    ),
  },
};

/** Failed to load: announced, because it replaces content after load. */
export const Failed: Story = {
  render: function Failed() {
    const [tries, setTries] = React.useState(0);
    return (
      <EmptyState
        role="alert"
        tone="danger"
        icon={<AlertIcon />}
        title="Couldn't load the board"
        actions={
          <Button size="sm" onClick={() => setTries((n) => n + 1)}>
            Retry
          </Button>
        }
      >
        <p>
          The register didn't answer. Tried <span data-testid="tries">{tries + 1}</span>{" "}
          {tries === 0 ? "time" : "times"}.
        </p>
      </EmptyState>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const alert = c.getByRole("alert");
    await expect(alert).toHaveTextContent("Couldn't load the board");
    await userEvent.click(c.getByRole("button", { name: "Retry" }));
    await expect(c.getByTestId("tries")).toHaveTextContent("2");
  },
};

/** All four, for VRT. */
export const States: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 22rem))",
        gap: 16,
      }}
    >
      <EmptyState icon={<InboxIcon />} title="No issues yet" headingLevel={3}>
        <p>Issues you file show up here.</p>
      </EmptyState>
      <EmptyState
        icon={<SearchIcon />}
        title="No issues match"
        headingLevel={3}
        actions={
          <Button variant="secondary" size="sm">
            Clear filters
          </Button>
        }
      >
        <p>Status: Blocked · Owner: Unowned</p>
      </EmptyState>
      <EmptyState
        tone="warning"
        icon={<ClockIcon />}
        title="This data is 3 days old"
        headingLevel={3}
      >
        <p>The last sync failed.</p>
      </EmptyState>
      <EmptyState
        tone="danger"
        icon={<AlertIcon />}
        title="Couldn't load the board"
        headingLevel={3}
        actions={<Button size="sm">Retry</Button>}
      >
        <p>The register didn't answer.</p>
      </EmptyState>
    </div>
  ),
};
