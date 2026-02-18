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
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        'primary-light': '#d47a4d', // Lighter shade of #b4522a
        'primary-dark': '#994222',  // Darker shade of #b4522a
        'secondary-light': '#4a4a4a',// Lighter shade of #2e2e2e
        'secondary-dark': '#1e1e1e', // Darker shade of #2e2e2e
        'accent-dark': '#614d40',   // Darker shade of #7a6151
      },
    },
  },
  plugins: [],
};
export default config;
