"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Check, FileText, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AGENTS_PROMPT =
  "Read https://voraui.vercel.app/agents.md and follow it to install Vora UI crypto analytics components in this project.";

type CopyState = "idle" | "copied" | "error";

export function AgentsCopyButton() {
  const [state, setState] = useState<CopyState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AGENTS_PROMPT);
      setState("copied");
    } catch {
      setState("error");
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setState("idle"), 1500);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={copyPrompt}
      aria-label="Copy prompt for AI agents"
      className="relative h-8 w-24 overflow-hidden rounded-full border-transparent bg-transparent font-mono text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-1.5 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none",
          state === "idle" ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
        )}
      >
        AGENTS.md
      </span>
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-1.5 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none",
          state === "copied" ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        )}
      >
        <Check data-icon="inline-start" className="size-3.5" />
        copied
      </span>
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-1.5 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none",
          state === "error" ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        )}
      >
        <TriangleAlert data-icon="inline-start" className="size-3.5" />
        failed
      </span>
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Agent prompt copied" : state === "error" ? "Copy failed" : "Copy agent prompt"}
      </span>
    </Button>
  );
}
