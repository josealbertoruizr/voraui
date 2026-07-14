import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Image
            src="/logo/voraui-black.svg"
            alt=""
            width={32}
            height={17}
            className="block dark:hidden"
          />
          <Image
            src="/logo/voraui-white.svg"
            alt=""
            width={32}
            height={17}
            className="hidden dark:block"
          />
          Vora UI
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/docs"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground"
          >
            Docs
          </Link>
          <a
            href="https://github.com/josealbertoruizr/voraui"
            target="_blank"
            rel="noreferrer"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground"
          >
            GitHub
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
