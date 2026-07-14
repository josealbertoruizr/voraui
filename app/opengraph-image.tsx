import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoSvg = readFileSync(join(process.cwd(), "public/logo/voraui-white.svg"), "utf-8");
const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          color: "#fafafa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img src={logoDataUri} width={64} height={34} alt="" />
          <div style={{ fontSize: 72, fontWeight: 700 }}>Vora UI</div>
        </div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#a1a1aa" }}>
          Crypto analytics components for shadcn/ui
        </div>
      </div>
    ),
    size,
  );
}
