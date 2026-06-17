/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: '#0A0E27',
        secondary: '#111638',
        accent: {
          green: '#00D68F',
          'green-light': '#00F5A0',
          red: '#FF4757',
          'red-light': '#FF6B7A',
          yellow: '#FFA502',
          blue: '#3B82F6',
          purple: '#A855F7',
          pink: '#EC4899',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
