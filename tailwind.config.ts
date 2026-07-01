import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F8F6F3",
        ink: "#111111",
        brown: {
          DEFAULT: "#8C5A43",
          light: "#A8735A",
          dark: "#6E4634",
        },
        gold: {
          DEFAULT: "#C8A96A",
          light: "#DCC392",
          dark: "#A9884B",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.35em",
      },
      boxShadow: {
        soft: "0 20px 60px -20px rgba(17, 17, 17, 0.12)",
        card: "0 30px 80px -30px rgba(17, 17, 17, 0.18)",
        gold: "0 20px 60px -25px rgba(200, 169, 106, 0.55)",
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #C8A96A 0%, #DCC392 50%, #C8A96A 100%)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        "gradient-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(4%, -6%) scale(1.08)" },
          "66%": { transform: "translate(-5%, 4%) scale(0.96)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        float: "float 7s ease-in-out infinite",
        "gradient-drift": "gradient-drift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
