"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, SCAN_NAV_ITEM, type NavItem } from "@/components/nav-items";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function useActiveSegment(orgSlug: string) {
  const pathname = usePathname();
  const prefix = `/org/${orgSlug}/`;
  return pathname.startsWith(prefix) ? pathname.slice(prefix.length).split("/")[0] : "";
}

function NavLink({
  orgSlug,
  item,
  active,
  className,
  onNavigate,
}: {
  orgSlug: string;
  item: NavItem;
  active: boolean;
  className?: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={`/org/${orgSlug}/${item.segment}`}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

export function OrgSidebar({ orgSlug }: { orgSlug: string }) {
  const activeSegment = useActiveSegment(orgSlug);

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar md:text-sidebar-foreground">
      <div className="px-4 py-5">
        <Link
          href={`/org/${orgSlug}/dashboard`}
          className="text-lg font-semibold text-sidebar-foreground"
        >
          Locatrack
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        <NavLink
          orgSlug={orgSlug}
          item={SCAN_NAV_ITEM}
          active={activeSegment === SCAN_NAV_ITEM.segment}
          className="mb-3 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
        />
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.segment}
            orgSlug={orgSlug}
            item={item}
            active={activeSegment === item.segment}
          />
        ))}
      </nav>
    </aside>
  );
}

const MOBILE_PRIMARY_SEGMENTS = ["dashboard", "inventory", "loans"];

export function OrgMobileNav({ orgSlug }: { orgSlug: string }) {
  const activeSegment = useActiveSegment(orgSlug);
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = NAV_ITEMS.filter((item) =>
    MOBILE_PRIMARY_SEGMENTS.includes(item.segment),
  );
  const moreItems = NAV_ITEMS.filter(
    (item) => !MOBILE_PRIMARY_SEGMENTS.includes(item.segment),
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-sidebar-border bg-sidebar text-sidebar-foreground md:hidden"
      aria-label="Navigation principale"
    >
      <Link
        href={`/org/${orgSlug}/${SCAN_NAV_ITEM.segment}`}
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium",
          activeSegment === SCAN_NAV_ITEM.segment
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/80",
        )}
      >
        <SCAN_NAV_ITEM.icon className="size-6" aria-hidden />
        {SCAN_NAV_ITEM.label}
      </Link>
      {primaryItems.map((item) => {
        const Icon = item.icon;
        const active = activeSegment === item.segment;
        return (
          <Link
            key={item.segment}
            href={`/org/${orgSlug}/${item.segment}`}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium",
              active ? "text-sidebar-primary" : "text-sidebar-foreground/80",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium",
              moreItems.some((item) => item.segment === activeSegment)
                ? "text-sidebar-primary"
                : "text-sidebar-foreground/80",
            )}
          >
            <MoreHorizontal className="size-5" aria-hidden />
            Plus
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle>Plus d&apos;options</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4">
            {moreItems.map((item) => (
              <NavLink
                key={item.segment}
                orgSlug={orgSlug}
                item={item}
                active={activeSegment === item.segment}
                className="text-foreground hover:bg-accent data-[active=true]:bg-accent"
                onNavigate={() => setMoreOpen(false)}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
