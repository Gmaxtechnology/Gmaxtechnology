/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F2942',
          dark: '#0A1D30',
          light: '#1C3F5F',
        },
        gold: {
          DEFAULT: '#D4A017',
          light: '#E8C158',
          dark: '#A67D0F',
        },
        cream: '#FAF9F6',
        charcoal: '#1C1C1C',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
    },
  },
  plugins: [],
};
