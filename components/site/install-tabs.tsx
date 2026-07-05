"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MANAGERS = [
  { id: "pnpm", command: (name: string) => `pnpm dlx shadcn@latest add @voraui/${name}` },
  { id: "npm", command: (name: string) => `npx shadcn@latest add @voraui/${name}` },
  { id: "yarn", command: (name: string) => `yarn shadcn@latest add @voraui/${name}` },
  { id: "bun", command: (name: string) => `bunx --bun shadcn@latest add @voraui/${name}` },
] as const;

export function InstallTabs({ name }: { name: string }) {
  const [copied, setCopied] = React.useState<string | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopied(id);
    timerRef.current = setTimeout(() => setCopied(null), 1500);
  };

  React.useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <Tabs defaultValue="pnpm">
      <TabsList>
        {MANAGERS.map((m) => (
          <TabsTrigger key={m.id} value={m.id}>
            {m.id}
          </TabsTrigger>
        ))}
      </TabsList>
      {MANAGERS.map((m) => (
        <TabsContent key={m.id} value={m.id}>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
            <span className="overflow-x-auto whitespace-nowrap">{m.command(name)}</span>
            <button
              type="button"
              aria-label="Copy command"
              onClick={() => copy(m.command(name), m.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {copied === m.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
