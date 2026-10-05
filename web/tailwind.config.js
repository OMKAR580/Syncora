/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#09090b',
          card: '#121216',
          border: 'rgba(239, 68, 68, 0.25)'
        },
        primary: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
          accent: '#ff2e4d',
          glow: 'rgba(239, 68, 68, 0.4)'
        }
      }
    },
  },
  plugins: [],
}
