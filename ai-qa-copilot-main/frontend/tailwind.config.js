/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#09090b',     // Premium Zinc-950
        darkCard: '#18181b',   // Zinc-900
        darkBorder: '#27272a', // Zinc-800
        brandIndigo: '#6366f1',
        brandViolet: '#8b5cf6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
