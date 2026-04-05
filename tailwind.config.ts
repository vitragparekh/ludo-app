import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        'dice-shake': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(-15deg)' },
          '20%': { transform: 'rotate(15deg)' },
          '30%': { transform: 'rotate(-10deg)' },
          '40%': { transform: 'rotate(10deg)' },
          '50%': { transform: 'rotate(-5deg)' },
          '60%': { transform: 'rotate(5deg)' },
          '70%': { transform: 'rotate(-2deg)' },
          '80%': { transform: 'rotate(2deg)' },
          '90%': { transform: 'rotate(0deg)' },
        },
      },
      animation: {
        'dice-shake': 'dice-shake 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
};
export default config;
