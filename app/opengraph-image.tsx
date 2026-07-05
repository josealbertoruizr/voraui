import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          <div style={{ width: 28, height: 28, background: "#8b5cf6", borderRadius: 6 }} />
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
