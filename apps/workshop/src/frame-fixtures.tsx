import {
  Link,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
} from "@i258/ui";
import type * as React from "react";

declare global {
  interface Window {
    /** Sidebar items whose click was followed, when a test sets it to []. */
    __demoFollowed?: string[];
  }
}

/*
  Synthetic, generic content for the frame stories. No app data: the frame
  is domain-free, so the fixtures are too.
*/

function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const icons = {
  inbox: <Icon d="M2.5 9.5h3l1 1.5h3l1-1.5h3M2.5 9.5 4 3.5h8l1.5 6v3h-11z" />,
  folder: <Icon d="M2.5 4.5h4l1.5 1.5h5.5v6.5h-11z" />,
  chart: <Icon d="M3 13V8M8 13V3M13 13v-3" />,
  gear: <Icon d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" />,
  star: <Icon d="m8 2 1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3l-3.7 2 .8-4.1L2 6.3l4.2-.5z" />,
  panel: <Icon d="M2.5 3.5h11v9h-11zM6 3.5v9" />,
  close: <Icon d="M4 4l8 8M12 4l-8 8" />,
};

const NAV = [
  {
    title: "Workspace",
    items: [
      {
        id: "inbox",
        label: "Inbox",
        icon: icons.inbox,
        count: 12,
        countLabel: "12 unread",
      },
      { id: "projects", label: "Projects", icon: icons.folder },
      {
        id: "reports",
        label: "Reports",
        icon: icons.chart,
        count: 2,
        countLabel: "2 failing",
        tone: "danger" as const,
      },
    ],
  },
  {
    title: "Saved",
    items: [
      { id: "starred", label: "Starred", icon: icons.star },
      { id: "settings", label: "Settings", icon: icons.gear },
    ],
  },
];

export function DemoSidebar({
  current = "inbox",
  footer,
}: {
  current?: string;
  /** Extra footer content (e.g. an action that opens a record). */
  footer?: React.ReactNode;
}) {
  return (
    <Sidebar>
      <SidebarHeader>
        <strong data-sidebar-text style={{ padding: "0 0.5rem" }}>
          Example app
        </strong>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((section) => (
          <SidebarSection key={section.title} title={section.title}>
            {section.items.map((item) => (
              <SidebarItem
                key={item.id}
                href={`#${item.id}`}
                icon={item.icon}
                current={item.id === current}
                count={"count" in item ? item.count : undefined}
                countLabel={"countLabel" in item ? item.countLabel : undefined}
                countTone={"tone" in item ? item.tone : undefined}
                // As a router link would: its own onClick on the `render`
                // element, which stays on the story and logs the click as
                // followed. A rail long-press's click never reaches it.
                render={
                  // SidebarItem merges href, role and keyboard handling into
                  // this element; on its own it only looks like a bare anchor.
                  // biome-ignore lint/a11y/noStaticElementInteractions: render-prop element
                  // biome-ignore lint/a11y/useKeyWithClickEvents: render-prop element
                  <a
                    // biome-ignore lint/a11y/useValidAnchor: render-prop element
                    onClick={(e) => {
                      if (!e.defaultPrevented) window.__demoFollowed?.push(item.id);
                      e.preventDefault();
                    }}
                  />
                }
              >
                {item.label}
              </SidebarItem>
            ))}
          </SidebarSection>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <span data-sidebar-text style={{ padding: "0 0.5rem", color: "var(--i258-muted)" }}>
          Synced 2 min ago
        </span>
        {footer}
      </SidebarFooter>
    </Sidebar>
  );
}

export const ROWS = Array.from({ length: 8 }, (_, i) => ({
  id: `item-${i + 1}`,
  title: `Example record ${i + 1}`,
}));

/** A long run of focus stops below the fold, for scroll-padding checks. */
export function LongContent({ count = 40 }: { count?: number }) {
  return (
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: "none",
        display: "grid",
        gap: 8,
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <Link href={`#stop-${i + 1}`} onClick={(e) => e.preventDefault()} data-stop={i + 1}>
            Focus stop {i + 1}
          </Link>
        </li>
      ))}
    </ul>
  );
}
