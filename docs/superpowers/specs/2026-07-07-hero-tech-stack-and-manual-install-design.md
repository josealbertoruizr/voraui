# Hero Tech Stack Row + Manual Installation Docs

## Context

The user wants two additions to the Vora UI site.
First, a "built with" row in the landing page hero, crediting the technologies the components are actually built on (React, TypeScript, Tailwind CSS, TradingView's `lightweight-charts`, Motion, shadcn/ui), similar to how Magic UI shows its stack under its hero CTA buttons.
Second, a "Manual" installation method on every component's docs page - a step-by-step, copy-pasteable walkthrough of adding the component's real source files by hand, as an alternative to the CLI, again modeled after how Magic UI (and shadcn/ui itself) present a "Manual" tab alongside the CLI command.

This was scoped through a brainstorming session; the user approved auto-generating the manual steps from the existing `registry.json` and the real source files (rather than hand-writing a separate simplified walkthrough per component), and approved a monochrome icon row for the hero (all six technologies, including TradingView and shadcn/ui, not just the four Magic UI shows).

## Goals

1. Add a "built with" icon row to the landing page hero, below the "Browse Components" button.
2. Add a "Manual" tab to each of the four docs pages' Installation section, alongside the existing CLI tab, generated from the real `registry.json` metadata and real source files - so it can never drift out of sync with what the CLI actually installs.

## Non-goals

- No changes to `registry.json`'s content, shape, or the CLI install flow.
- No changes to any registry component's actual source.
- No auto-detection of a consumer's import aliases/tsconfig paths - the "update your import paths" step stays a static reminder, same as shadcn/ui's and Magic UI's own manual docs.
- No redesign of the existing CLI tab (`components/site/install-tabs.tsx`) - it moves under a new "CLI" tab label, unchanged otherwise.

## 1. Hero tech stack row

**File:** `app/page.tsx`, plus a new `components/site/tech-stack.tsx`.

A `<TechStack />` component renders six monochrome SVG icons in a horizontal row (wrapping on narrow widths), placed directly below the existing "Browse Components" button in the hero section - matching Magic UI's layout, where the tech row sits at the very bottom of the hero block.

Icons come from the `simple-icons` package, imported per-icon (e.g. `import { siReact } from "simple-icons/icons"`) so the bundle only includes the six paths actually used, not the full icon set. The six: `react`, `typescript`, `tailwindcss`, `tradingview`, `framer` (representing Motion - the library formerly named Framer Motion doesn't have its own distinct `simple-icons` entry yet, so the original Framer mark stands in, the same substitution Magic UI itself uses), `shadcnui`. Each renders as `<svg viewBox="0 0 24 24"><path d={icon.path} fill="currentColor" /></svg>` sized small (e.g. 20-24px) and dimmed via `text-muted-foreground`, so it reads as a quiet credibility strip rather than competing with the headline.

## 2. Manual installation - architecture

### Registry data access

**New file:** `lib/registry.ts`.

```ts
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

export function getRegistryItem(name: string): RegistryItem;
export function readRegistryFile(relativePath: string): string;
```

`getRegistryItem` looks up an entry by `name` in the repo's existing `registry.json` (imported directly as a JSON module) and throws if not found - a docs page always passes a name that exists, so this is a programmer-error guard, not a user-facing error path. `readRegistryFile` reads a file's real contents off disk (`fs.readFileSync`, resolved from the repo root via `process.cwd()`), used to pull each file listed in a `RegistryItem`'s `files` array.

### Code display

**New files:** `components/site/code-block.tsx` (server), `components/site/code-block-shell.tsx` (client), `lib/shiki.ts` (singleton highlighter).

Syntax highlighting needs `shiki` (the same highlighter shadcn/ui's own docs use), which does its work server-side - so the split is: `code-block.tsx` is an async Server Component that gets a shared highlighter instance from `lib/shiki.ts` (created once and cached across requests, not per-render) and calls `codeToHtml(code, { lang, themes: { light: "github-light", dark: "github-dark" } })`, producing HTML that carries both themes as CSS variables. It passes that HTML string, plus the filename and line count, to `<CodeBlockShell>`.

`code-block-shell.tsx` is a small Client Component (needs interactivity) that renders the passed-in HTML via `dangerouslySetInnerHTML`, plus a header bar (filename, copy-to-clipboard button reusing the same copy/checkmark pattern already in `install-tabs.tsx`). Files over a threshold of 30 lines render at a fixed max-height with a bottom fade and an "Expand code" / "Collapse" toggle; shorter files render fully open with no toggle. The 30-line threshold decision is exposed as a small pure function, `shouldCollapse(code: string, thresholdLines = 30): boolean`, in `code-block.tsx` so it's unit-testable without rendering anything.

### Manual install steps

**New file:** `components/site/manual-install.tsx` (server).

```ts
export function ManualInstall({ name }: { name: string }): JSX.Element;
```

Given a component name, it calls `getRegistryItem(name)` and renders three numbered steps:

1. **Install dependencies** - one copyable command (`npm install <dependencies.join(" ")>`) built from the item's `dependencies` array. If `registryDependencies` includes anything besides `"utils"` (e.g. `"button"` for BTC Rainbow Chart), a short note follows: "This component also expects shadcn/ui's `button` primitive - add it with `npx shadcn@latest add button` if you don't already have it." (`"utils"` itself isn't called out, since every consumer following shadcn/ui's own setup already has `lib/utils.ts`.)
2. **Copy the files into your project** - one `<CodeBlock>` per entry in `files`, each labeled with its `target` path (e.g. `components/voraui/trading-chart.tsx`), showing the real file content read via `readRegistryFile(path)`.
3. **Update the import paths** - a static paragraph noting that the copied files use `@/lib/utils` and `@/components/ui/*` imports, and to adjust them to match the consumer's own path aliases if different - the same caveat shadcn/ui and Magic UI both give, since there's no reliable way to auto-detect a consumer's tsconfig paths.

### Docs page integration

**Files:** `app/docs/trading-chart/page.tsx`, `app/docs/btc-rainbow-chart/page.tsx`, `app/docs/fear-greed-gauge/page.tsx`, `app/docs/altseason-gauge/page.tsx`.

Each page's existing:

```tsx
<section className="space-y-3">
  <h2 className="text-xl font-semibold">Installation</h2>
  <InstallTabs name="trading-chart" />
</section>
```

becomes:

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

(with the matching `name` per page), reusing the `Tabs` primitive already used by `InstallTabs` itself.

## New dependencies

- `shiki` - syntax highlighting, server-only usage.
- `simple-icons` - brand SVG path data, imported per-icon.

Both are build/render-time only; neither adds client-side runtime cost beyond the static SVGs and the pre-rendered highlighted HTML.

## Testing

- `lib/registry.ts`: unit test `getRegistryItem` against the real `registry.json` for at least one item, asserting the returned `files`/`dependencies`/`registryDependencies` match what's actually in the file.
- `code-block.tsx`'s `shouldCollapse`: unit test with code under/over the 30-line threshold.
- Manual/visual verification: load all four docs pages, switch to the "Manual" tab, confirm the shown file contents match the real registry source files, confirm long files (`trading-chart.tsx`) collapse with a working expand toggle and short files (`altseason.ts`) render fully open, confirm copy buttons work, and check both light and dark themes.
- Hero tech row: visual check in light/dark themes and at mobile width for wrapping.
