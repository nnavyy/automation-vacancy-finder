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
        background: "var(--background)",
        foreground: "var(--foreground)",
        public: {
          50: "#111a2d", 100: "#17233b", 200: "#263650", 300: "#394c68",
          400: "#526178", 500: "#5d6d84", 600: "#627187", 700: "#a9b7cc",
          800: "#d9e0ec", 900: "#eef2f9", 950: "#f5f7fb",
        },
        field: {
          ink: "#f5f7fb", panel: "#ffffff", raised: "#eef2f9", line: "#d9e0ec",
          paper: "#17233b", muted: "#526178", accent: "#3848d4", match: "#16664c",
        },
      },
    },
  },
  plugins: [],
};
export default config;
