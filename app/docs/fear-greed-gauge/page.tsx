import { ComponentPreview } from "@/components/site/component-preview";
import { DemoPreview } from "@/components/site/demo-preview";
import { FearGreedGaugeDemo } from "@/components/site/fear-greed-gauge-demo";
import { InstallTabs } from "@/components/site/install-tabs";
import { ManualInstall } from "@/components/site/manual-install";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropsTable } from "@/components/site/props-table";
import { FearGreedGauge } from "@/registry/voraui/fear-greed-gauge/fear-greed-gauge";
import { FearGreedGaugeSkeleton } from "@/registry/voraui/fear-greed-gauge/fear-greed-gauge-skeleton";

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

      <DemoPreview source="components/site/fear-greed-gauge-demo.tsx">
        <div className="flex min-h-[300px] items-center justify-center">
          <FearGreedGaugeDemo />
        </div>
      </DemoPreview>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Variants</h2>

        <div className="space-y-3">
          <h3 className="text-base font-semibold">Gradient</h3>
          <p className="text-sm text-muted-foreground">
            The default variant: a smooth continuous color blend with just the dial, needle, and
            number.
          </p>
          <ComponentPreview>
            <FearGreedGauge />
          </ComponentPreview>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold">Minimal</h3>
          <p className="text-sm text-muted-foreground">
            variant=&quot;minimal&quot; shows the same layout with 5 discrete color bands instead
            of a continuous gradient.
          </p>
          <ComponentPreview>
            <FearGreedGauge variant="minimal" />
          </ComponentPreview>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold">Ticks</h3>
          <p className="text-sm text-muted-foreground">
            variant=&quot;ticks&quot; swaps the solid arc for 100 individual gradient tick marks
            (one per index value) plus numeric labels, speedometer-style.
          </p>
          <ComponentPreview>
            <FearGreedGauge variant="ticks" />
          </ComponentPreview>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold">Wedges</h3>
          <p className="text-sm text-muted-foreground">
            variant=&quot;wedges&quot; shows equal-width pie-slice zone sectors with numeric dial
            ticks; the zone matching the current value is highlighted, the rest stay neutral gray.
          </p>
          <ComponentPreview>
            <FearGreedGauge variant="wedges" />
          </ComponentPreview>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Skeleton</h2>
        <p className="text-sm text-muted-foreground">
          FearGreedGauge shows this shaped skeleton automatically while its bundled fetcher loads.
          Import FearGreedGaugeSkeleton directly for a React Suspense fallback or an SSR placeholder.
        </p>
        <ComponentPreview>
          <FearGreedGaugeSkeleton variant="wedges" />
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
              type: '"minimal" | "ticks" | "gradient" | "wedges"',
              defaultValue: '"gradient"',
              description:
                "\"gradient\" is a smooth continuous color blend with just the dial, needle, and number; \"minimal\" shows the same layout with 5 discrete color bands instead; \"ticks\" swaps the solid arc for 100 individual gradient tick marks; \"wedges\" shows pie-slice zone sectors with the current zone highlighted.",
            },
            {
              name: "animateOnLoad",
              type: "boolean",
              defaultValue: "true",
              description: "Spring the needle in from neutral (12 o'clock) on first render instead of snapping straight to its value.",
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
