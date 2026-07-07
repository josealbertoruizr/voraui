"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CodeBlockShell({
  html,
  code,
  filename,
  collapsible,
}: {
  html: string;
  code: string;
  filename: string;
  collapsible: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  };

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="font-mono text-xs text-muted-foreground">{filename}</span>
        <div className="flex items-center gap-3">
          {collapsible && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {expanded ? "Collapse" : "Expand code"}
            </button>
          )}
          <button
            type="button"
            aria-label="Copy code"
            onClick={copy}
            className="text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div
        className={cn(
          "relative overflow-x-auto p-4 text-xs",
          collapsible && !expanded && "max-h-[420px] overflow-y-hidden",
        )}
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {collapsible && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-muted/40 to-transparent" />
        )}
      </div>
    </div>
  );
}
