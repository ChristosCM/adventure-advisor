import { ImageResponse } from "next/og";
import { config } from "@/data/config";

// Static metadata for the generated image. WhatsApp/social read these from the
// <meta> tags Next emits alongside the route.
export const alt =
  "Adventure Advisor — best sport, best spot, best weather for your weekend";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const home = config.home.name.replace("Home — ", "");

/**
 * The link-preview "banner" that unfurls when the URL is shared (WhatsApp,
 * iMessage, Slack, etc.). Drawn entirely with flexbox + emoji so the output
 * PNG stays well under WhatsApp's ~300KB threshold for the large preview card.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          // Adventure dusk: deep teal base with a warm sunrise glow top-right.
          background:
            "radial-gradient(1200px 600px at 85% 0%, rgba(249,115,22,0.35), transparent 55%), linear-gradient(135deg, #042f2e 0%, #0e221d 55%, #0b1f1a 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand pill */}
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "14px 26px",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.16)",
              fontSize: "30px",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            <span style={{ fontSize: "38px" }}>🏔️</span>
            <span>ADVENTURE ADVISOR</span>
          </div>
        </div>

        {/* Headline + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "82px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: "920px",
            }}
          >
            Where should you adventure this weekend?
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              fontSize: "36px",
              fontWeight: 600,
              color: "#5eead4",
            }}
          >
            Best sport
            <span style={{ color: "#64748b" }}>·</span>
            best spot
            <span style={{ color: "#64748b" }}>·</span>
            <span style={{ color: "#fb923c" }}>best weather</span>
          </div>
        </div>

        {/* Activity strip + home base */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "20px", fontSize: "52px" }}>
            <span>🚵</span>
            <span>🧗</span>
            <span>🏄</span>
            <span>🥾</span>
            <span>🛶</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "28px",
              color: "#cbd5e1",
            }}
          >
            <span style={{ fontSize: "30px" }}>📍</span>
            from {home}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
