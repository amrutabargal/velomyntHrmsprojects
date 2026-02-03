/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': {
          primary: '#0f172a',
          secondary: '#1e293b',
          tertiary: '#334155',
        },
        'dark-text': {
          primary: '#e2e8f0',
          secondary: '#cbd5e1',
        },
        'dark-border': '#475569',
        'dark-accent': {
          primary: '#3b82f6',
          secondary: '#2563eb',
        },
      },
    },
  },
  plugins: [],
}

