import type { ReactNode } from "react";
import { CodeBlock } from "@/components/site/code-block";
import { InstallTabs } from "@/components/site/install-tabs";

export const metadata = { title: "Installation" };

const registryConfig = `{
  "registries": {
    "@voraui": "https://voraui.vercel.app/r/{name}.json"
  }
}`;

const importExample = `import { TradingChart } from "@/components/voraui/trading-chart"

export default function Home() {
  return <TradingChart />
}`;

function InlineCode({ children }: { children: ReactNode }) {
  return <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>;
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <li className="relative space-y-3 pl-10">
      <span
        aria-hidden
        className="absolute left-0 top-0 flex size-7 items-center justify-center rounded-full bg-muted font-mono text-sm font-medium"
      >
        {number}
      </span>
      <h2 className="text-lg font-semibold leading-7">{title}</h2>
      {children}
    </li>
  );
}

export default function InstallationPage() {
  return (
    <main className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Installation</h1>
        <p className="mt-2 text-muted-foreground">
          How to install dependencies and structure your app.
        </p>
      </div>

      <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm">
        <span className="font-semibold">Note:</span> We have the exact same installation process as{" "}
        <a
          href="https://ui.shadcn.com/docs/installation"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4"
        >
          shadcn/ui
        </a>
        , and Vora UI is listed in the{" "}
        <a
          href="https://ui.shadcn.com/docs/directory?q=vora"
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4"
        >
          shadcn registry directory
        </a>
        .
      </p>

      <ol className="space-y-10">
        <Step number={1} title="Create project">
          <p className="text-sm text-muted-foreground">
            Run the <InlineCode>init</InlineCode> command to create a new Next.js project or to set
            up an existing one:
          </p>
          <InstallTabs args="init" />
        </Step>

        <Step number={2} title="Add components">
          <p className="text-sm text-muted-foreground">
            You can now start adding components to your project.
          </p>
          <InstallTabs args="add @voraui/trading-chart" />
        </Step>

        <Step number={3} title="Import component">
          <p className="text-sm text-muted-foreground">
            The command above will add the <InlineCode>TradingChart</InlineCode> component to{" "}
            <InlineCode>components/voraui/trading-chart/</InlineCode>. You can then import it like
            this:
          </p>
          <CodeBlock code={importExample} lang="tsx" filename="app/page.tsx" lineNumbers />
        </Step>
      </ol>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data out of the box</h2>
        <p className="text-sm text-muted-foreground">
          Every component ships with a hook that fetches free, keyless public APIs
          (alternative.me, CoinPaprika, Binance), so it renders real data immediately.
          For production you can pass your own data via props and the bundled fetcher is skipped.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Troubleshooting</h2>
        <p className="text-sm text-muted-foreground">
          If an older shadcn CLI does not resolve <InlineCode>@voraui</InlineCode>, add the
          namespace to the <InlineCode>registries</InlineCode> key of your{" "}
          <InlineCode>components.json</InlineCode>:
        </p>
        <CodeBlock code={registryConfig} lang="json" filename="components.json" />
        <p className="text-sm text-muted-foreground">
          Or skip the namespace and use the full URL form:
        </p>
        <InstallTabs args="add https://voraui.vercel.app/r/trading-chart.json" />
        <p className="text-sm text-muted-foreground">
          Installed before components moved into per-component folders? Re-adding a component
          writes the new folder but leaves the old flat files in{" "}
          <InlineCode>components/voraui/</InlineCode> behind: delete those and point your imports at
          the new folder.
        </p>
      </section>
    </main>
  );
}
