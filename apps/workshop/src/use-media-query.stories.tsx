import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { FRAME_NARROW_INSPECTOR, FRAME_NARROW_NAV, useMediaQuery } from "@i258/ui";

/**
 * `useMediaQuery(query, fallback?)` — `fallback` on the server and during
 * hydration, then the live value. AppFrame uses it with the shared frame
 * breakpoints, exported as `FRAME_NARROW_NAV` (768px) and
 * `FRAME_NARROW_INSPECTOR` (980px).
 */
const meta = {
  title: "Patterns/useMediaQuery",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function Readout() {
  const nav = useMediaQuery(FRAME_NARROW_NAV);
  const inspector = useMediaQuery(FRAME_NARROW_INSPECTOR);
  return (
    <dl style={{ margin: 0 }}>
      <dt>Nav is a sheet</dt>
      <dd data-testid="nav">{String(nav)}</dd>
      <dt>Inspector is a sheet</dt>
      <dd data-testid="inspector">{String(inspector)}</dd>
    </dl>
  );
}

function Mountable() {
  const [on, setOn] = React.useState(true);
  return (
    <div>
      <button type="button" onClick={() => setOn((v) => !v)}>
        {on ? "Unmount" : "Mount"}
      </button>
      {on ? <Readout /> : null}
    </div>
  );
}

/** Listeners are added once per query and removed on unmount. */
export const Subscription: Story = {
  render: () => <Mountable />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // Story tests run at 1280px: neither pane is a sheet.
    await expect(c.getByTestId("nav")).toHaveTextContent("false");
    await expect(c.getByTestId("inspector")).toHaveTextContent("false");

    // Count live `change` listeners on every list the hook creates.
    const realMatchMedia = window.matchMedia;
    let live = 0;
    window.matchMedia = (query: string) => {
      const mql = realMatchMedia.call(window, query);
      const add = mql.addEventListener.bind(mql);
      const remove = mql.removeEventListener.bind(mql);
      mql.addEventListener = ((type: string, ...rest: [never, never?]) => {
        if (type === "change") live += 1;
        return add(type, ...rest);
      }) as typeof mql.addEventListener;
      mql.removeEventListener = ((type: string, ...rest: [never, never?]) => {
        if (type === "change") live -= 1;
        return remove(type, ...rest);
      }) as typeof mql.removeEventListener;
      return mql;
    };
    try {
      await userEvent.click(c.getByRole("button", { name: "Unmount" }));
      await userEvent.click(c.getByRole("button", { name: "Mount" }));
      await waitFor(() => expect(live).toBe(2));
      await userEvent.click(c.getByRole("button", { name: "Unmount" }));
      await waitFor(() => expect(live).toBe(0));
    } finally {
      window.matchMedia = realMatchMedia;
    }
  },
};
