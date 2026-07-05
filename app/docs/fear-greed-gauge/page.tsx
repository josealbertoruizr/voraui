import { ComponentPreview } from "@/components/site/component-preview";
import { InstallTabs } from "@/components/site/install-tabs";
import { PropsTable } from "@/components/site/props-table";
import { FearGreedGauge } from "@/registry/voraui/fear-greed-gauge/fear-greed-gauge";

export const metadata = { title: "Fear & Greed Gauge" };

export default function Page() {
  return (
    <main className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fear &amp; Greed Gauge</h1>
        <p className="mt-2 text-muted-foreground">
          The crypto Fear &amp; Greed index as an SVG dial. Fetches live data from alternative.me,
          refreshed every 10 minutes.
        </p>
      </div>

      <ComponentPreview>
        <FearGreedGauge />
      </ComponentPreview>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Installation</h2>
        <InstallTabs name="fear-greed-gauge" />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Props</h2>
        <PropsTable
          rows={[
            {
              name: "data",
              type: "FearGreedData",
              description:
                "Your own data ({ value, label, updatedAt }). When set, the bundled fetcher is skipped entirely.",
            },
            { name: "className", type: "string", description: "Extra classes for the wrapper." },
          ]}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data source</h2>
        <p className="text-sm text-muted-foreground">
          GET https://api.alternative.me/fng/?limit=1. Free, keyless, CORS-enabled. The bundled
          useFearGreed hook polls it every 10 minutes; pass refreshInterval to change that.
        </p>
      </section>
    </main>
  );
}
