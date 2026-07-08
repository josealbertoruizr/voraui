import { ComponentPreview } from "@/components/site/component-preview";
import { InstallTabs } from "@/components/site/install-tabs";
import { ManualInstall } from "@/components/site/manual-install";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <h2 className="text-xl font-semibold">Variants</h2>
        <p className="text-sm text-muted-foreground">
          The default full variant shown above includes zone labels around the dial. Pass
          variant=&quot;minimal&quot; for a smaller footprint with just the dial, needle, and
          number.
        </p>
        <ComponentPreview>
          <FearGreedGauge variant="minimal" />
        </ComponentPreview>
        <p className="text-sm text-muted-foreground">
          variant=&quot;ticks&quot; swaps the solid arc for 100 individual gradient tick marks
          (one per index value) plus numeric labels, speedometer-style.
        </p>
        <ComponentPreview>
          <FearGreedGauge variant="ticks" />
        </ComponentPreview>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Installation</h2>
        <Tabs defaultValue="cli">
          <TabsList>
            <TabsTrigger value="cli">CLI</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="cli">
            <InstallTabs name="fear-greed-gauge" />
          </TabsContent>
          <TabsContent value="manual">
            <ManualInstall name="fear-greed-gauge" />
          </TabsContent>
        </Tabs>
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
            {
              name: "variant",
              type: '"full" | "minimal" | "ticks"',
              defaultValue: '"full"',
              description:
                "\"full\" shows the zone labels around the dial; \"minimal\" shows just the dial, needle, and number; \"ticks\" swaps the solid arc for 100 individual gradient tick marks.",
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
