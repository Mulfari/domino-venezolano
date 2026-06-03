import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        felt: "#0B5345",
        wood: "#3E2723",
        gold: "#D4AF37",
        ivory: "#F5F0E1",
        teamA: "#1E88E5",
        teamB: "#D4AF37",
        pip: "#1A1A1A",
      },
    },
  },
  plugins: [],
};

export default config;
