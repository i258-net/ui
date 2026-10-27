import * as React from "react";

import { useComposedRefs } from "../lib/compose-refs.js";
import { cn } from "../lib/utils.js";

/*
  A plain semantic table with kit styling: hairline rows, a sticky header,
  tabular numerals, cell padding from the density set. No sorting,
  selection or virtualisation: those are the app's, on top of real
  <th>/<td> semantics.
*/

export type TableContainerProps = React.ComponentProps<"div">;

/**
 * Wrap a table so a wide one scrolls inside its own box rather than the
 * page (WCAG 1.4.10). While it overflows it is a keyboard stop (2.1.1)
 * and, if you name it with `aria-label` or `aria-labelledby`, a region; a
 * table that fits is neither (and the name is dropped, since a plain box
 * can't carry one). Overflow is re-checked when the container or the
 * table resizes and when the table element is replaced.
 */
export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
  function TableContainer(
    { className, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props },
    ref,
  ) {
    const local = React.useRef<HTMLDivElement | null>(null);
    const [scrolls, setScrolls] = React.useState(false);
    React.useEffect(() => {
      const el = local.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const check = () =>
        setScrolls(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
      const resize = new ResizeObserver(check);
      let child: Element | null = null;
      const watch = () => {
        if (el.firstElementChild !== child) {
          if (child) resize.unobserve(child);
          child = el.firstElementChild;
          if (child) resize.observe(child);
        }
        check();
      };
      resize.observe(el);
      watch();
      const children = new MutationObserver(watch);
      children.observe(el, { childList: true });
      return () => {
        resize.disconnect();
        children.disconnect();
      };
    }, []);
    const composedRef = useComposedRefs(local, ref);
    const region = scrolls && (ariaLabel != null || ariaLabelledBy != null);
    return (
      // biome-ignore lint/a11y/useAriaPropsSupportedByRole: the label props are only set alongside role="region" (see `region` above); the rule cannot follow the conditional.
      <div
        ref={composedRef}
        data-slot="table-container"
        data-scrolls={scrolls ? "" : undefined}
        tabIndex={scrolls ? 0 : undefined}
        role={region ? "region" : undefined}
        aria-label={region ? ariaLabel : undefined}
        aria-labelledby={region ? ariaLabelledBy : undefined}
        className={cn("i258-table-wrap", className)}
        {...props}
      />
    );
  },
);

export type TableProps = React.ComponentProps<"table">;

export const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, ...props },
  ref,
) {
  return <table ref={ref} data-slot="table" className={cn("i258-table", className)} {...props} />;
});

export type TableCaptionProps = React.ComponentProps<"caption">;

/** The table's name. Give every table one; hide it with `i258-sr-only` if a heading already shows it. */
export const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  function TableCaption({ className, ...props }, ref) {
    return <caption ref={ref} className={cn("i258-table__caption", className)} {...props} />;
  },
);

export type TableHeaderProps = React.ComponentProps<"thead">;

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  function TableHeader(props, ref) {
    return <thead ref={ref} {...props} />;
  },
);

export type TableBodyProps = React.ComponentProps<"tbody">;

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  function TableBody(props, ref) {
    return <tbody ref={ref} {...props} />;
  },
);

export type TableRowProps = React.ComponentProps<"tr">;

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { className, ...props },
  ref,
) {
  return <tr ref={ref} className={cn("i258-table__row", className)} {...props} />;
});

type CellExtras = {
  /** Right-aligned, for numbers you compare down a column. */
  numeric?: boolean | undefined;
};

export type TableHeadProps = React.ComponentProps<"th"> & CellExtras;

/** A header cell; `scope` defaults to `col`. Use `scope="row"` for a row's leading cell. */
export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
  { className, numeric, scope = "col", ...props },
  ref,
) {
  return (
    <th
      ref={ref}
      scope={scope}
      data-numeric={numeric ? "" : undefined}
      className={cn(scope === "row" ? "i258-table__row-head" : "i258-table__head", className)}
      {...props}
    />
  );
});

export type TableCellProps = React.ComponentProps<"td"> &
  CellExtras & {
    /** Monospace, for ids, hashes and amounts. */
    mono?: boolean | undefined;
  };

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { className, numeric, mono, ...props },
  ref,
) {
  return (
    <td
      ref={ref}
      data-numeric={numeric ? "" : undefined}
      data-mono={mono ? "" : undefined}
      className={cn("i258-table__cell", className)}
      {...props}
    />
  );
});
