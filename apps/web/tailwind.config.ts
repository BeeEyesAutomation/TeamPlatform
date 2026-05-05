import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "#d9dee7",
        surface: "#f7f8fb",
        ink: "#172033",
        muted: "#64748b",
        primary: "#0f766e",
        accent: "#b45309"
      }
    }
  },
  plugins: []
};

export default config;
