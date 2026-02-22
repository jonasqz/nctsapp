import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ncts.app — The NCT Framework, finally a tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0f1e",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 88px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "52px" }}>
          <span style={{ color: "white", fontSize: 28, fontWeight: 600, letterSpacing: "-0.5px" }}>
            ncts
          </span>
          <span style={{ color: "#f59e0b", fontSize: 28, fontWeight: 700 }}>.</span>
          <span style={{ color: "white", fontSize: 28, fontWeight: 600, letterSpacing: "-0.5px" }}>
            app
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            color: "white",
            fontSize: 68,
            fontWeight: 600,
            lineHeight: 1.08,
            marginBottom: "28px",
            maxWidth: "920px",
            letterSpacing: "-1.5px",
          }}
        >
          The NCT Framework,{" "}
          <span style={{ color: "#f59e0b" }}>finally a tool.</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: "#64748b",
            fontSize: 26,
            lineHeight: 1.5,
            maxWidth: "680px",
          }}
        >
          Connect strategy to execution. Narratives, Commitments &amp; Tasks in one
          hierarchy.
        </div>

        {/* Badges */}
        <div style={{ display: "flex", marginTop: "52px", gap: "12px" }}>
          {["NCT-native", "Open Source", "AI-ready", "Free"].map((badge) => (
            <div
              key={badge}
              style={{
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                color: "#f59e0b",
                padding: "8px 18px",
                borderRadius: "99px",
                fontSize: 17,
                fontWeight: 500,
              }}
            >
              {badge}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
