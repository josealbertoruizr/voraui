"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Image
            src="/logo/voraui-black.svg"
            alt=""
            width={24}
            height={16}
            className="block dark:hidden"
          />
          <Image
            src="/logo/voraui-white.svg"
            alt=""
            width={24}
            height={16}
            className="hidden dark:block"
          />
          <span className="leading-none">Vora UI</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">

          <Badge variant="default" >
            <Button
              onClick={() => {
                navigator.clipboard.writeText("AGENTS.md");
              }}
              className="cursor-pointer"
              size="small"
            >
              AGENTS.MD
            </Button>
          </Badge>

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
