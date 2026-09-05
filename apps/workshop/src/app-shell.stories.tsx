import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppShell, Badge, Link, ToggleChip } from "@i258/ui";

/**
 * The bar every app wears. Sizes and spacing are fixed by the kit — the two
 * stories below are the honeycomb and abacus headers, and their titles must
 * render at the same step (ui#59, from Daniel's side-by-side screenshot).
 *
 * The toggle shows its dark default in every story, including light ones:
 * Storybook has no `themeScript` in the document head, so nothing syncs the
 * control to the toolbar theme. Deterministic, so VRT is stable — apps that
 * do run `themeScript` never see it.
 */
const meta = {
  title: "Patterns/AppShell",
  component: AppShell,
  parameters: { layout: "padded" },
  args: { title: "Honeycomb", user: "Daniel Newton" },
  argTypes: {
    themeToggle: { control: "boolean" },
    title: { control: "text" },
    subtitle: { control: "text" },
    user: { control: "text" },
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Nav + meta + a domain action in `end` — the honeycomb register header. */
export const WithNav: Story = {
  name: "With nav",
  args: {
    title: "Honeycomb",
    nav: (
      <>
        <ToggleChip>triage (34 decision/action)</ToggleChip>
        <ToggleChip>board</ToggleChip>
      </>
    ),
    meta: (
      <>
        <span>github:i258-net/dotbuzz/PLANS/ISSUES@main</span>
        <span>170 issues from GitHub</span>
      </>
    ),
    end: <Badge variant="accent">1 pending</Badge>,
  },
};

/** Subtitle instead of nav — the abacus home header. */
export const WithSubtitle: Story = {
  name: "With subtitle",
  args: { title: "Abacus", subtitle: "Beans operator view" },
};

/** A back-link title still renders at the shared title size. */
export const TitleAsLink: Story = {
  name: "Title as link",
  args: { title: <Link href="#">← Honeycomb</Link>, user: undefined },
};

/**
 * Local `next dev` has no forward-auth headers, so the app passes no `user`
 * and the slot collapses rather than reserving space.
 */
export const NoIdentity: Story = {
  name: "No identity",
  args: { title: "Abacus", subtitle: "Beans operator view", user: undefined },
};
