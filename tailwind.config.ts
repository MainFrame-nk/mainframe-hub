import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Твоя палитра MainFrame Hub
        obsidian: {
          DEFAULT: "#090A0F", // Глубокий фон
          card: "#12131A",    // Металлический фон карточек
          border: "#1E202B",  // Тонкие рамки
        },
        cyber: {
          purple: "#8B5CF6",  // Неоновый фиолетовый
          cyan: "#00F0FF",    // Электрический бирюзовый
          crimson: "#FF2A5F", // Вишневый/алый акцент
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