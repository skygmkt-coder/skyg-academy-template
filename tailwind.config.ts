import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}","./components/**/*.{ts,tsx}","./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base:    "#070B12",
        surface: "#0D1421",
        glass:   "rgba(255,255,255,0.04)",
        primary: { DEFAULT:"#3589F2", dark:"#0068C9", glow:"rgba(53,137,242,0.25)" },
        accent:  "#E8004A",
        muted:   "#8FA4C4",
        border:  "rgba(255,255,255,0.08)",
      },
      fontFamily: {
        display: ["Sora","sans-serif"],
        body:    ["DM Sans","sans-serif"],
      },
      backdropBlur: { glass: "20px" },
      boxShadow: {
        glass:  "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        glow:   "0 0 40px rgba(53,137,242,0.3)",
        card:   "0 8px 32px rgba(0,0,0,0.5)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.5s ease forwards",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:    { "0%":{ opacity:"0", transform:"translateY(20px)" }, "100%":{ opacity:"1", transform:"translateY(0)" } },
        fadeIn:    { "0%":{ opacity:"0" }, "100%":{ opacity:"1" } },
        glowPulse: { "0%,100%":{ opacity:"0.6" }, "50%":{ opacity:"1" } },
      },
    },
  },
  plugins: [],
};
export default config;
