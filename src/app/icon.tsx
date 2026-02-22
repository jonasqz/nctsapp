import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0f1e",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "7px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-1px",
            marginRight: "-1px",
          }}
        >
          n
        </span>
        <span style={{ color: "#f59e0b", fontSize: 20, fontWeight: 800, lineHeight: 1 }}>
          .
        </span>
      </div>
    ),
    { ...size },
  );
}
