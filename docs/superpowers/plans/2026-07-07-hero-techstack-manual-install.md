# Hero Tech Stack Row + Manual Installation Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "built with" tech icon row to the landing page hero, and a registry.json-driven "Manual" installation tab to every component's docs page, generated from the real source files.

**Architecture:** A small server-side pipeline (`lib/registry.ts` reads `registry.json` + real source files, `lib/shiki.ts` + `components/site/code-block.tsx`/`code-block-shell.tsx` render them with syntax highlighting) feeds a `ManualInstall` component wired into each docs page's existing `Tabs`-based Installation section, alongside the current CLI tab. Separately, a static `TechStack` component renders six brand SVGs in the hero.

**Tech Stack:** Next.js 16 App Router (Server + Client Components), `shiki` (syntax highlighting), `simple-icons` (brand SVG path data), the project's existing `Tabs` primitive (`@base-ui/react/tabs`), Vitest.

## Global Constraints

- No changes to `registry.json`'s content or shape.
- No changes to any registry component's actual source (`registry/voraui/**`).
- No auto-detection of a consumer's import aliases - "update your import paths" stays a static reminder.
- No redesign of the existing CLI tab (`components/site/install-tabs.tsx`) - it moves under a new "CLI" label, unchanged otherwise.
- Node 22 is required to run any `pnpm` command in this repo - prefix every command with `export PATH="/opt/homebrew/opt/node@22/bin:$PATH"` (the default `node` on PATH is v20, which pnpm rejects).

---

### Task 1: Registry data access (`lib/registry.ts`)

**Files:**
- Create: `lib/registry.ts`
- Modify: `next.config.ts`
- Test: `tests/registry.test.ts`

**Interfaces:**
- Produces: `RegistryFile { path: string; type: string; target: string }`, `RegistryItem { name: string; type: string; title: string; description: string; dependencies?: string[]; registryDependencies?: string[]; files: RegistryFile[] }`, `getRegistryItem(name: string): RegistryItem` (throws if not found), `readRegistryFile(relativePath: string): string`. Tasks 2 and 3 consume these.

- [ ] **Step 1: Write the failing test**

Create `tests/registry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getRegistryItem, readRegistryFile } from "@/lib/registry";

describe("getRegistryItem", () => {
  it("returns the fear-greed-gauge item with its real files, dependencies, and registry dependencies", () => {
    const item = getRegistryItem("fear-greed-gauge");
    expect(item.title).toBe("Fear & Greed Gauge");
    expect(item.dependencies).toEqual(["lucide-react"]);
    expect(item.registryDependencies).toEqual(["utils"]);
    expect(item.files).toEqual([
      {
        path: "registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx",
        type: "registry:component",
        target: "components/voraui/fear-greed-gauge.tsx",
      },
      {
        path: "registry/voraui/fear-greed-gauge/use-fear-greed.ts",
        type: "registry:hook",
        target: "components/voraui/use-fear-greed.ts",
      },
    ]);
  });

  it("throws for an unknown item name", () => {
    expect(() => getRegistryItem("does-not-exist")).toThrow(
      'No registry item named "does-not-exist"',
    );
  });
});

describe("readRegistryFile", () => {
  it("reads the real contents of a registry source file", () => {
    const content = readRegistryFile("registry/voraui/fear-greed-gauge/use-fear-greed.ts");
    expect(content).toContain("export function useFearGreed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm exec vitest run tests/registry.test.ts`
Expected: FAIL with `Cannot find module '@/lib/registry'` (or similar - the module doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `lib/registry.ts`:

```ts
import fs from "node:fs";
import path from "node:path";
import registryConfig from "@/registry.json";

export interface RegistryFile {
  path: string;
  type: string;
  target: string;
}

export interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
}

export function getRegistryItem(name: string): RegistryItem {
  const item = (registryConfig.items as RegistryItem[]).find((i) => i.name === name);
  if (!item) {
    throw new Error(`No registry item named "${name}" in registry.json`);
  }
  return item;
}

export function readRegistryFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm exec vitest run tests/registry.test.ts`
Expected: PASS, 3/3 tests.

- [ ] **Step 5: Make production builds bundle the registry source files**

`readRegistryFile` reads files at runtime with a dynamically-built path (constructed from `registry.json`'s data at request time, in a loop), which Next.js's static file-trace analysis (used to decide what a deployed serverless function bundles) generally cannot follow - it only reliably detects `fs.readFileSync` calls with literal string arguments. Without an explicit include rule, a production deployment (e.g. Vercel) could omit `registry/voraui/**` from the docs pages' serverless function bundle, causing `ENOENT` in production even though local `pnpm dev` works fine (the whole repo is on disk there).

Replace the contents of `next.config.ts` with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/docs/**": ["./registry/voraui/**/*", "./registry.json"],
  },
};

export default nextConfig;
```

- [ ] **Step 6: Verify a production build includes the files**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm build`
Expected: build succeeds. Then confirm the trace output actually lists the registry files:

Run: `grep -l "trading-chart.tsx" .next/server/app/docs/trading-chart/page.js.nft.json`
Expected: the file path is printed (i.e. the trace manifest for that page references `registry/voraui/trading-chart/trading-chart.tsx`), confirming the include rule worked. If this step is run before Task 4 wires any registry-file-reading code into the docs pages, the trace manifest won't yet reference these files - it's fine to defer the final confirmation of this exact grep to Task 4's verification, but keep the `next.config.ts` change now since Task 2/3 build on top of it.

- [ ] **Step 7: Commit**

```bash
git add lib/registry.ts tests/registry.test.ts next.config.ts
git commit -m "feat: add registry.json data access for manual install docs"
```

---

### Task 2: Syntax-highlighted code block (`shiki` + `CodeBlock`)

**Files:**
- Create: `lib/code-block.ts`
- Create: `lib/shiki.ts`
- Create: `components/site/code-block.tsx`
- Create: `components/site/code-block-shell.tsx`
- Modify: `app/globals.css`
- Modify: `package.json` (add `shiki` dependency)
- Test: `tests/code-block.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `shouldCollapse(code: string, thresholdLines?: number): boolean` (default threshold 30), `highlightCode(code: string, lang: string): Promise<string>`, `<CodeBlock code={string} lang={string} filename={string} />` (async Server Component). Task 3 consumes `CodeBlock`.

- [ ] **Step 1: Write the failing test for the collapse threshold**

Create `tests/code-block.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { shouldCollapse } from "@/lib/code-block";

describe("shouldCollapse", () => {
  it("does not collapse code at or under the default threshold (30 lines)", () => {
    const code = Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n");
    expect(shouldCollapse(code)).toBe(false);
  });

  it("collapses code over the default threshold", () => {
    const code = Array.from({ length: 31 }, (_, i) => `line ${i}`).join("\n");
    expect(shouldCollapse(code)).toBe(true);
  });

  it("respects a custom threshold", () => {
    const code = Array.from({ length: 5 }, (_, i) => `line ${i}`).join("\n");
    expect(shouldCollapse(code, 4)).toBe(true);
    expect(shouldCollapse(code, 5)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm exec vitest run tests/code-block.test.ts`
Expected: FAIL with `Cannot find module '@/lib/code-block'`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/code-block.ts`:

```ts
export const DEFAULT_COLLAPSE_THRESHOLD_LINES = 30;

export function shouldCollapse(
  code: string,
  thresholdLines: number = DEFAULT_COLLAPSE_THRESHOLD_LINES,
): boolean {
  return code.split("\n").length > thresholdLines;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm exec vitest run tests/code-block.test.ts`
Expected: PASS, 3/3 tests.

- [ ] **Step 5: Install shiki**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm add shiki`
Expected: `shiki` added to `package.json` dependencies.

- [ ] **Step 6: Add the shiki highlighter helper**

Create `lib/shiki.ts`:

```ts
import { codeToHtml } from "shiki";

export async function highlightCode(code: string, lang: string): Promise<string> {
  return codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}
```

`defaultColor: false` makes shiki emit both themes' colors as CSS variables on every token instead of picking one as the rendered default - the CSS added in Step 8 switches between them based on the site's existing `.dark` class.

- [ ] **Step 7: Add the CodeBlock server component and its client shell**

Create `components/site/code-block-shell.tsx`:

```tsx
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
```

Create `components/site/code-block.tsx`:

```tsx
import { highlightCode } from "@/lib/shiki";
import { shouldCollapse } from "@/lib/code-block";
import { CodeBlockShell } from "@/components/site/code-block-shell";

export async function CodeBlock({
  code,
  lang,
  filename,
}: {
  code: string;
  lang: string;
  filename: string;
}) {
  const html = await highlightCode(code, lang);
  return (
    <CodeBlockShell html={html} code={code} filename={filename} collapsible={shouldCollapse(code)} />
  );
}
```

- [ ] **Step 8: Add the dual-theme CSS**

In `app/globals.css`, append after the closing brace of the existing `@layer base { ... }` block (after line 130):

```css

.shiki {
  margin: 0;
  background-color: transparent !important;
}
.shiki,
.shiki span {
  color: var(--shiki-light);
}
.dark .shiki,
.dark .shiki span {
  color: var(--shiki-dark);
}
```

- [ ] **Step 9: Run the full test suite and lint**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm test && pnpm lint && pnpm exec tsc --noEmit`
Expected: all existing tests plus the 3 new ones pass (49/49 total), lint clean, no type errors.

- [ ] **Step 10: Commit**

```bash
git add lib/code-block.ts lib/shiki.ts components/site/code-block.tsx components/site/code-block-shell.tsx app/globals.css package.json pnpm-lock.yaml tests/code-block.test.ts
git commit -m "feat: add syntax-highlighted CodeBlock component"
```

---

### Task 3: Manual install steps (`ManualInstall`)

**Files:**
- Create: `components/site/manual-install.tsx`

**Interfaces:**
- Consumes: `getRegistryItem`, `readRegistryFile` (Task 1), `CodeBlock` (Task 2).
- Produces: `<ManualInstall name={string} />` (async Server Component). Task 4 consumes this.

- [ ] **Step 1: Write the component**

Create `components/site/manual-install.tsx`:

```tsx
import { getRegistryItem, readRegistryFile } from "@/lib/registry";
import { CodeBlock } from "@/components/site/code-block";

function langForFile(filePath: string): string {
  return filePath.endsWith(".tsx") ? "tsx" : "ts";
}

export async function ManualInstall({ name }: { name: string }) {
  const item = getRegistryItem(name);
  const deps = item.dependencies ?? [];
  const extraRegistryDeps = (item.registryDependencies ?? []).filter((d) => d !== "utils");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="font-medium">1. Install the following dependencies:</p>
        {deps.length > 0 ? (
          <CodeBlock code={`npm install ${deps.join(" ")}`} lang="bash" filename="Terminal" />
        ) : (
          <p className="text-sm text-muted-foreground">No external npm dependencies.</p>
        )}
        {extraRegistryDeps.length > 0 && (
          <p className="text-sm text-muted-foreground">
            This component also expects the shadcn/ui {extraRegistryDeps.map((d) => `\`${d}\``).join(", ")}{" "}
            primitive{extraRegistryDeps.length > 1 ? "s" : ""} - add {extraRegistryDeps.length > 1 ? "them" : "it"}{" "}
            with{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              npx shadcn@latest add {extraRegistryDeps.join(" ")}
            </code>{" "}
            if you don&apos;t already have {extraRegistryDeps.length > 1 ? "them" : "it"}.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="font-medium">2. Copy the following files into your project:</p>
        <div className="space-y-4">
          {item.files.map((file) => (
            <CodeBlock
              key={file.path}
              code={readRegistryFile(file.path)}
              lang={langForFile(file.path)}
              filename={file.target}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-medium">3. Update the import paths:</p>
        <p className="text-sm text-muted-foreground">
          The files above import from{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">@/lib/utils</code> and{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">@/components/ui/*</code>. Adjust
          those to match your own project&apos;s path aliases if they differ.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/site/manual-install.tsx
git commit -m "feat: add ManualInstall component generating steps from registry.json"
```

---

### Task 4: Wire the CLI/Manual tabs into all four docs pages

**Files:**
- Modify: `app/docs/trading-chart/page.tsx`
- Modify: `app/docs/btc-rainbow-chart/page.tsx`
- Modify: `app/docs/fear-greed-gauge/page.tsx`
- Modify: `app/docs/altseason-gauge/page.tsx`

**Interfaces:**
- Consumes: `ManualInstall` (Task 3), `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (`@/components/ui/tabs`, already in the codebase), `InstallTabs` (already in the codebase, unchanged).

- [ ] **Step 1: Update `app/docs/trading-chart/page.tsx`**

Add these two imports after the existing `import { InstallTabs } from "@/components/site/install-tabs";` line:

```tsx
import { ManualInstall } from "@/components/site/manual-install";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

Replace:

```tsx
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Installation</h2>
        <InstallTabs name="trading-chart" />
      </section>
```

with:

```tsx
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Installation</h2>
        <Tabs defaultValue="cli">
          <TabsList>
            <TabsTrigger value="cli">CLI</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="cli">
            <InstallTabs name="trading-chart" />
          </TabsContent>
          <TabsContent value="manual">
            <ManualInstall name="trading-chart" />
          </TabsContent>
        </Tabs>
      </section>
```

- [ ] **Step 2: Update `app/docs/btc-rainbow-chart/page.tsx`**

Same edit as Step 1, with `name="btc-rainbow-chart"` in both the `<InstallTabs>` and `<ManualInstall>` tags, and the same two new imports added after the existing `import { InstallTabs } from "@/components/site/install-tabs";` line.

- [ ] **Step 3: Update `app/docs/fear-greed-gauge/page.tsx`**

Same edit as Step 1, with `name="fear-greed-gauge"` in both tags.

- [ ] **Step 4: Update `app/docs/altseason-gauge/page.tsx`**

Same edit as Step 1, with `name="altseason-gauge"` in both tags.

- [ ] **Step 5: Type-check and lint**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 6: Verify a production build bundles the registry source files**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm build`
Expected: build succeeds.

Run: `grep -o "registry/voraui/trading-chart/trading-chart.tsx" .next/server/app/docs/trading-chart/page.js.nft.json`
Expected: prints the matched path (confirms Task 1's `outputFileTracingIncludes` rule is working now that a docs page actually calls `readRegistryFile`).

- [ ] **Step 7: Manually verify all four docs pages in the browser**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm dev` (skip if already running), then for each of `/docs/trading-chart`, `/docs/btc-rainbow-chart`, `/docs/fear-greed-gauge`, `/docs/altseason-gauge`:
- Confirm the Installation section now shows "CLI" and "Manual" tabs, CLI unchanged.
- Switch to "Manual", confirm step 1 shows the right `npm install` command (and, for BTC Rainbow Chart specifically, the `button` registry-dependency note - it's the only item with an extra registry dependency beyond `utils`).
- Confirm step 2 shows every file listed for that component (5 files for Trading Chart, 4 for BTC Rainbow Chart, 2 for Fear & Greed Gauge, 3 for Altseason Gauge) with correct filenames and real content matching the actual source files.
- Confirm `trading-chart.tsx` (866 lines) renders collapsed with a working "Expand code"/"Collapse" toggle, and a short file like `altseason.ts` renders fully open with no toggle.
- Click a copy button and confirm the clipboard receives the file's content (paste somewhere to check).
- Check both light and dark themes - confirm the code text is legible and the code block's background matches the surrounding `bg-muted/40` panels elsewhere on the site (no mismatched white/dark flash from shiki's own background).

- [ ] **Step 8: Commit**

```bash
git add app/docs/trading-chart/page.tsx app/docs/btc-rainbow-chart/page.tsx app/docs/fear-greed-gauge/page.tsx app/docs/altseason-gauge/page.tsx
git commit -m "feat: add Manual installation tab to all four docs pages"
```

---

### Task 5: Hero "built with" tech stack row

**Files:**
- Create: `components/site/tech-stack.tsx`
- Modify: `app/page.tsx`
- Modify: `package.json` (add `simple-icons` dependency)

**Interfaces:**
- Consumes: nothing from Tasks 1-4 (fully independent).
- Produces: `<TechStack />` (Server Component, no props).

- [ ] **Step 1: Install simple-icons**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm add simple-icons`
Expected: `simple-icons` added to `package.json` dependencies.

- [ ] **Step 2: Write the component**

Create `components/site/tech-stack.tsx`:

```tsx
import { siReact, siTypescript, siTailwindcss, siTradingview, siFramer, siShadcnui } from "simple-icons";

const TECHNOLOGIES = [siReact, siTypescript, siTailwindcss, siTradingview, siFramer, siShadcnui];

export function TechStack() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
      {TECHNOLOGIES.map((icon) => (
        <svg key={icon.slug} role="img" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <title>{icon.title}</title>
          <path d={icon.path} />
        </svg>
      ))}
    </div>
  );
}
```

`siFramer` represents Motion in this row - the animation library formerly named Framer Motion doesn't have its own distinct `simple-icons` entry yet, so the original Framer mark stands in (per the approved design spec).

- [ ] **Step 3: Wire it into the hero**

In `app/page.tsx`, add the import after the existing `import { Button } from "@/components/ui/button";` line:

```tsx
import { TechStack } from "@/components/site/tech-stack";
```

Then insert `<TechStack />` right after the button's wrapping `<div>` and before the closing `</section>` of the hero:

```tsx
        <div className="flex justify-center">
          <Button render={<a href="#showcase" />} nativeButton={false} size="lg" className="rounded-full">
            Browse Components
          </Button>
        </div>
        <TechStack />
      </section>
```

- [ ] **Step 4: Type-check and lint**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 5: Manually verify in the browser**

With `pnpm dev` running, load `/`, confirm the six icons render in a row below the "Browse Components" button, in both light and dark themes, and that they wrap onto a second line without overlapping at a narrow (390px) viewport width.

- [ ] **Step 6: Commit**

```bash
git add components/site/tech-stack.tsx app/page.tsx package.json pnpm-lock.yaml
git commit -m "feat: add built-with tech stack row to landing page hero"
```

---

## Final verification (after all five tasks)

1. `pnpm test` - confirm 49/49 tests pass (46 existing + 3 registry + 3 code-block, minus any overlap - exact count depends on task order, but no existing test should fail).
2. `pnpm lint` and `pnpm exec tsc --noEmit` - both clean.
3. `pnpm build` - production build succeeds, and the `.nft.json` trace check from Task 4 Step 6 confirms registry source files are bundled.
4. In the browser: hero shows the tech stack row; all four docs pages show working CLI/Manual tabs with accurate, real file contents; light/dark themes both look correct throughout.
