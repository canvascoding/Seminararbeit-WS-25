import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "loop-green": "#78BE20",
        "loop-green-dark": "#4E8A12",
        "loop-sand": "#F7F3EA",
        "loop-slate": "#07131A",
        "loop-amber": "#FFB347",
        "loop-rose": "#EF476F",
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-plex-mono)", ...defaultTheme.fontFamily.mono],
      },
      boxShadow: {
        "loop-card":
          "0.8px 1.1px 1.9px rgba(7, 19, 26, 0.07), 6px 12px 40px rgba(7, 19, 26, 0.08)",
      },
      borderRadius: {
        loop: "1.75rem",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
