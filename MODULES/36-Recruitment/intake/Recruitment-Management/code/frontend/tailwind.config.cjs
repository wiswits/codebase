/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0F2147',
        'navy-light': '#1A3A6B',
        gold: '#C8A04E',
        'gold-light': '#D4B06A',
        ivory: '#F7F4EC',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        'source-sans': ['Source Sans Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
};