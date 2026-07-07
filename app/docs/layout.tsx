import Link from "next/link";

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

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
      <aside className="hidden w-52 shrink-0 sm:block">
        <nav className="sticky top-20 space-y-4 text-sm">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
