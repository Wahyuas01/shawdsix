/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#0F172A', 900: '#111827', 800: '#1E293B' },
        brandblue: { 700: '#1E40AF', 600: '#2563EB', 500: '#3B82F6' },
      },
    },
  },
  plugins: [],
};
