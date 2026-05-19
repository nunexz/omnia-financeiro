/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f59e0b', // Amarelo Omnia
        secondary: '#6366f1',
      },
    },
  },
  plugins: [],
}
