import { ComponentPreview } from "@/components/site/component-preview";
import { InstallTabs } from "@/components/site/install-tabs";
import { ManualInstall } from "@/components/site/manual-install";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropsTable } from "@/components/site/props-table";
import { AltseasonGauge } from "@/registry/voraui/altseason-gauge/altseason-gauge";

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

      <ComponentPreview>
        <AltseasonGauge />
      </ComponentPreview>

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
              type: '"24h" | "7d" | "30d" | "1y"',
              defaultValue: '"7d"',
              description: "Comparison window for the bundled fetcher. Ignored when data is set.",
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
          is pure if you want to run it on your own ticker data. Note: CoinPaprika&apos;s bulk tickers
          endpoint currently only populates the 24h and 7d change columns; when a window&apos;s column is
          dead the gauge reports the score as unavailable instead of a misleading 0.
        </p>
      </section>
    </main>
  );
}
