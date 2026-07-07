export const metadata = { title: "Installation" };

const registryConfig = `{
  "registries": {
    "@voraui": "https://voraui.vercel.app/r/{name}.json"
  }
}`;

export default function InstallationPage() {
  return (
    <main className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Installation</h1>
        <p className="mt-2 text-muted-foreground">
          Vora UI is a shadcn registry. Components install as source code into your project.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. Add the registry</h2>
        <p className="text-sm text-muted-foreground">
          Add the @voraui namespace to the registries key of your components.json:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm">
          {registryConfig}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. Add components</h2>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm">
          pnpm dlx shadcn@latest add @voraui/trading-chart
        </pre>
        <p className="text-sm text-muted-foreground">
          Files land in components/voraui/ and npm dependencies are installed automatically.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Zero-config alternative</h2>
        <p className="text-sm text-muted-foreground">
          The full URL form always works without touching components.json:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm">
          npx shadcn@latest add https://voraui.vercel.app/r/trading-chart.json
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data out of the box</h2>
        <p className="text-sm text-muted-foreground">
          Every component ships with a hook that fetches free, keyless public APIs
          (alternative.me, CoinPaprika, Binance), so it renders real data immediately.
          For production you can pass your own data via props and the bundled fetcher is skipped.
        </p>
      </section>
    </main>
  );
}
