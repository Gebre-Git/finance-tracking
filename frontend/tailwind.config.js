/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#fafafa',
        foreground: '#111111',
        muted: '#737373',
        border: '#e5e5e5',
        accent: {
          DEFAULT: '#3b82f6', // sleek blue
          hover: '#2563eb',
        },
        indigoAccent: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'IBM Plex Sans', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'premium-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
