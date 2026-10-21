import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Checkbox,
  Link,
  StatusLabel,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@i258/ui";

/**
 * A semantic table: real `<th scope>` and `<td>`, a caption for its name,
 * numbers right-aligned in tabular figures. TableContainer scrolls a wide
 * table inside its own box; only while it overflows is it a keyboard stop
 * and (named) a region.
 */
const meta = {
  title: "Primitives/Table",
  component: Table,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const POSTINGS = [
  { id: "P-1041", date: "2026-10-01", payee: "Northwind Utilities", account: "Expenses:Utilities", amount: "-84.20", status: "cleared" },
  { id: "P-1042", date: "2026-10-03", payee: "Example Grocer", account: "Expenses:Food", amount: "-126.05", status: "cleared" },
  { id: "P-1043", date: "2026-10-05", payee: "Payroll", account: "Income:Salary", amount: "3,100.00", status: "pending" },
  { id: "P-1044", date: "2026-10-09", payee: "Unknown payee", account: "Uncategorized", amount: "-12.99", status: "failed" },
] as const;

const TONE = { cleared: "success", pending: "muted", failed: "danger" } as const;

function Ledger({ caption = "October postings" }: { caption?: string }) {
  return (
    <Table>
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Id</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Payee</TableHead>
          <TableHead>Account</TableHead>
          <TableHead numeric>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {POSTINGS.map((p) => (
          <TableRow key={p.id}>
            <TableHead scope="row">
              <Link href={`#${p.id}`}>{p.id}</Link>
            </TableHead>
            <TableCell mono>{p.date}</TableCell>
            <TableCell>{p.payee}</TableCell>
            <TableCell>{p.account}</TableCell>
            <TableCell numeric mono>
              {p.amount}
            </TableCell>
            <TableCell>
              <StatusLabel size="sm" tone={TONE[p.status]}>
                {p.status}
              </StatusLabel>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const Default: Story = {
  render: () => (
    <TableContainer aria-label="October postings" style={{ maxWidth: 760 }}>
      <Ledger />
    </TableContainer>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const table = c.getByRole("table", { name: "October postings" });
    await expect(within(table).getAllByRole("columnheader")).toHaveLength(6);
    await expect(within(table).getAllByRole("rowheader")).toHaveLength(4);
    const amount = within(table).getByRole("cell", { name: "3,100.00" });
    await expect(getComputedStyle(amount).textAlign).toBe("end");
    // It fits, so the container is neither a tab stop nor a region.
    const container = canvasElement.querySelector("[data-slot='table-container']")!;
    await expect(container).not.toHaveAttribute("tabindex");
    await expect(container).not.toHaveAttribute("role");
    await expect(c.queryByRole("region")).toBeNull();
  },
};

/** Too wide for its box: it scrolls inside, and becomes a named, focusable region. */
export const Scrolling: Story = {
  render: () => (
    <div style={{ width: 320 }} data-testid="frame">
      <TableContainer aria-label="October postings">
        <Ledger />
      </TableContainer>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const region = await c.findByRole("region", { name: "October postings" });
    await expect(region).toHaveAttribute("tabindex", "0");
    await expect(c.getByTestId("frame").scrollWidth).toBeLessThanOrEqual(320);

    // Keyboard reaches it (then the browser's arrow keys scroll it), before
    // the links inside.
    await userEvent.click(document.body);
    await userEvent.tab();
    await expect(region).toHaveFocus();
    await userEvent.tab();
    await expect(within(region).getByRole("link", { name: "P-1041" })).toHaveFocus();
  },
};

/** The sticky header stays while a tall table scrolls in its container. */
export const StickyHeader: Story = {
  render: () => (
    <TableContainer aria-label="Postings" style={{ maxWidth: 560, maxHeight: 180 }}>
      <Table>
        <TableCaption className="i258-sr-only">Postings</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Id</TableHead>
            <TableHead numeric>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 20 }, (_, i) => (
            <TableRow key={i}>
              <TableCell mono>P-{1100 + i}</TableCell>
              <TableCell numeric mono>
                {(i * 13.37).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ),
  play: async ({ canvasElement }) => {
    const region = await within(canvasElement).findByRole("region", { name: "Postings" });
    const head = within(region).getAllByRole("columnheader")[0]!;
    const before = head.getBoundingClientRect().top;
    region.scrollTop = 200;
    await waitFor(() => expect(region.scrollTop).toBeGreaterThan(0));
    await expect(Math.round(head.getBoundingClientRect().top)).toBe(Math.round(before));
  },
};

/** Selection is the app's: a Checkbox per row, named by the row. */
export const WithSelection: Story = {
  render: function WithSelection() {
    const [picked, setPicked] = React.useState<string[]>([]);
    const all = picked.length === POSTINGS.length;
    return (
      <div style={{ display: "grid", gap: 8, maxWidth: 560 }}>
        <TableContainer>
          <Table>
            <TableCaption>Uncategorized postings</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 32 }}>
                  <Checkbox
                    aria-label="Select all"
                    checked={all}
                    indeterminate={picked.length > 0 && !all}
                    onCheckedChange={(on) => setPicked(on ? POSTINGS.map((p) => p.id) : [])}
                  />
                </TableHead>
                <TableHead>Payee</TableHead>
                <TableHead numeric>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {POSTINGS.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Checkbox
                      aria-label={`Select ${p.payee}`}
                      checked={picked.includes(p.id)}
                      onCheckedChange={(on) =>
                        setPicked((cur) => (on ? [...cur, p.id] : cur.filter((x) => x !== p.id)))
                      }
                    />
                  </TableCell>
                  <TableCell>{p.payee}</TableCell>
                  <TableCell numeric mono>
                    {p.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <p style={{ margin: 0 }} aria-live="polite">
          <output data-testid="count">{picked.length}</output> selected
        </p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("checkbox", { name: "Select Payroll" }));
    await expect(c.getByTestId("count")).toHaveTextContent("1");
    await expect(c.getByRole("checkbox", { name: "Select all" })).toHaveAttribute("aria-checked", "mixed");
    await userEvent.click(c.getByRole("checkbox", { name: "Select all" }));
    await expect(c.getByTestId("count")).toHaveTextContent("4");
    // The 24px target holds in a compact table cell too.
    const box = c.getByRole("checkbox", { name: "Select Payroll" }).getBoundingClientRect();
    await expect(box.width).toBeGreaterThanOrEqual(24);
    await expect(box.height).toBeGreaterThanOrEqual(24);
  },
};

/** Cells take their block padding from the density set. */
export const Density: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, maxWidth: 760 }}>
      {(["comfortable", "compact"] as const).map((d) => (
        <div key={d} data-density={d} data-testid={d}>
          <TableContainer>
            <Ledger caption={`October postings (${d})`} />
          </TableContainer>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    const rowHeight = (d: string) => within(c.getByTestId(d)).getAllByRole("row")[1]!.getBoundingClientRect().height;
    await expect(rowHeight("compact")).toBeLessThan(rowHeight("comfortable"));
  },
};
