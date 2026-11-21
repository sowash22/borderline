import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Borderline — draw a country from memory, then meet the real outline.";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f6f7fb",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              color: "#6346ed",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "#6346ed",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
              }}
            >
              ✎
            </div>
            borderline.
          </div>
          <div
            style={{
              marginTop: 28,
              color: "#24232e",
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: -1.5,
            }}
          >
            Draw a country from memory.
          </div>
          <div
            style={{
              marginTop: 18,
              color: "#747481",
              fontSize: 28,
              lineHeight: 1.35,
            }}
          >
            Then meet the real outline.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div
            style={{
              width: 220,
              height: 300,
              background: "white",
              border: "1px solid #e2e3eb",
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="140" height="180" viewBox="0 0 140 180">
              <path
                d="M48 22 C70 18 86 38 92 58 C108 62 118 86 108 112 C96 148 78 162 52 168 C28 154 22 118 30 86 C26 58 34 28 48 22"
                fill="none"
                stroke="#6346ed"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            style={{
              width: 220,
              height: 300,
              background: "white",
              border: "1px solid #e2e3eb",
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="140" height="180" viewBox="0 0 140 180">
              <path
                d="M52 16 C78 12 96 32 102 56 C122 64 128 92 116 118 C102 158 78 168 50 170 C24 156 18 112 28 80 C22 52 32 22 52 16Z"
                fill="#e9e4fd"
                stroke="#6346ed"
                strokeWidth="5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
