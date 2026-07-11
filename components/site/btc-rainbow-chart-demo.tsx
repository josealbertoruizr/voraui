import {
  BtcRainbowChart,
  BtcRainbowLegend,
} from "@/registry/voraui/btc-rainbow-chart/btc-rainbow-chart";

export function BtcRainbowChartDemo() {
  return (
    <div className="space-y-4">
      <BtcRainbowChart />
      <BtcRainbowLegend />
    </div>
  );
}
