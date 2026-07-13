"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Getting Started",
    items: [
      { href: "/docs", label: "Introduction" },
      { href: "/docs/installation", label: "Installation" },
    ],
  },
  {
    label: "Components",
    items: [
      { href: "/docs/trading-chart", label: "Trading Chart" },
      { href: "/docs/btc-rainbow-chart", label: "BTC Rainbow Chart" },
      { href: "/docs/fear-greed-gauge", label: "Fear & Greed Gauge" },
      { href: "/docs/altseason-gauge", label: "Altseason Gauge" },
    ],
  },
];

const pages = navGroups.flatMap((group) => group.items);

export function DocsSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-20 space-y-4 text-sm">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1 text-muted-foreground">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-1.5",
                  pathname === item.href
                    ? "bg-muted text-foreground"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function DocsPager() {
  const pathname = usePathname();
  const index = pages.findIndex((page) => page.href === pathname);

  if (index === -1) return null;

  const prev = index > 0 ? pages[index - 1] : null;
  const next = index < pages.length - 1 ? pages[index + 1] : null;

  return (
    <nav aria-label="Docs pagination" className="mt-12 flex items-center justify-between">
      {prev ? (
        <Button
          render={<Link href={prev.href} />}
          nativeButton={false}
          variant="secondary"
          size="lg"
          className="rounded-xl"
        >
          <ArrowLeft data-icon="inline-start" />
          {prev.label}
        </Button>
      ) : (
        <span />
      )}
      {next ? (
        <Button
          render={<Link href={next.href} />}
          nativeButton={false}
          variant="secondary"
          size="lg"
          className="rounded-xl"
        >
          {next.label}
          <ArrowRight data-icon="inline-end" />
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}
