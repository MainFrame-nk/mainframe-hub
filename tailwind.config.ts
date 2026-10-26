import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "rgb(var(--bg-obsidian) / <alpha-value>)",
          card: "rgb(var(--bg-obsidian-card) / <alpha-value>)",
          border: "rgb(var(--bg-obsidian-border) / <alpha-value>)",
        },
        cyber: {
          purple: "#8B5CF6",
          cyan: "#00F0FF",
          crimson: "#FF2A5F",
        },
      },
      backgroundImage: {
        "cyber-radial": "radial-gradient(circle at center, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;