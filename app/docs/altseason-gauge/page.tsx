import { AltseasonGaugeDemo } from "@/components/site/altseason-gauge-demo";
import { CodeBlock } from "@/components/site/code-block";
import { ComponentPreview } from "@/components/site/component-preview";
import { DemoPreview } from "@/components/site/demo-preview";
import { InstallTabs } from "@/components/site/install-tabs";
import { ManualInstall } from "@/components/site/manual-install";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropsTable } from "@/components/site/props-table";
import { AltseasonGauge } from "@/registry/voraui/altseason-gauge";
import { AltseasonGaugeSkeleton } from "@/registry/voraui/altseason-gauge";

export const metadata = { title: "Altseason Gauge" };

export default function Page() {
  return (
    <main className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Altseason Gauge</h1>
        <p className="mt-2 text-muted-foreground">
          The Altcoin Season index: how many of the top-50 alts are outperforming BTC over a window.
          Score of 75 or more is Altcoin Season, 25 or less is Bitcoin Season.
        </p>
      </div>

      <DemoPreview source="components/site/altseason-gauge-demo.tsx">
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="w-full max-w-xl">
            <AltseasonGaugeDemo />
          </div>
        </div>
      </DemoPreview>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Variants</h2>
        <Tabs defaultValue="meter">
          <TabsList>
            <TabsTrigger value="meter">Meter</TabsTrigger>
            <TabsTrigger value="bars">Bars</TabsTrigger>
          </TabsList>
          <TabsContent value="meter" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The default variant: a three-zone track with a position thumb.
            </p>
            <ComponentPreview>
              <AltseasonGauge />
            </ComponentPreview>
            <CodeBlock code="<AltseasonGauge />" lang="tsx" filename="Usage" />
          </TabsContent>
          <TabsContent value="bars" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Draws one bar per compared altcoin and fills the ones outperforming BTC, so the strip
              is the computation itself. Bars are colored along the classic altseason spectrum, and
              the unfilled remainder stays faintly visible so the current position on the scale is
              always readable.
            </p>
            <ComponentPreview>
              <AltseasonGauge variant="bars" />
            </ComponentPreview>
            <CodeBlock code={'<AltseasonGauge variant="bars" />'} lang="tsx" filename="Usage" />
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Skeleton</h2>
        <p className="text-sm text-muted-foreground">
          AltseasonGauge shows this shaped skeleton automatically while its bundled fetcher loads.
          Import AltseasonGaugeSkeleton directly for a React Suspense fallback or an SSR placeholder.
        </p>
        <ComponentPreview>
          <AltseasonGaugeSkeleton />
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
            <InstallTabs name="altseason-gauge" />
          </TabsContent>
          <TabsContent value="manual">
            <ManualInstall name="altseason-gauge" />
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Props</h2>
        <PropsTable
          rows={[
            {
              name: "data",
              type: "AltseasonData",
              description:
                "Your own data ({ score, label, btcChangePct, window, compared, outperforming }). When set, the bundled fetcher is skipped.",
            },
            {
              name: "window",
              type: '"24h" | "7d"',
              defaultValue: '"7d"',
              description: "Comparison window for the bundled fetcher. Ignored when data is set.",
            },
            {
              name: "variant",
              type: '"meter" | "bars"',
              defaultValue: '"meter"',
              description:
                "\"meter\" is a three-zone track with a position thumb; \"bars\" draws one bar per compared altcoin, filling the alts that outperform BTC.",
            },
            {
              name: "animateOnLoad",
              type: "boolean",
              defaultValue: "true",
              description: "Spring the meter's thumb in from the center on first render instead of snapping straight to its score position.",
            },
            { name: "className", type: "string", description: "Extra classes for the wrapper." },
          ]}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data source and computation</h2>
        <p className="text-sm text-muted-foreground">
          GET https://api.coinpaprika.com/v1/tickers?quotes=USD. Free, keyless. The index is
          computed client-side following the blockchaincenter.net convention: take the top-50 alts
          by rank (stablecoins and wrapped BTC/ETH derivatives excluded), count how many outperform
          BTC over the window, and score it as a percentage. The exported computeAltseason function
          is pure if you want to run it on your own ticker data.
        </p>
      </section>
    </main>
  );
}
