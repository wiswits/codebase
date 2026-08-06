/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Matches the EduSuite design language from the AMS mockup: gray scale + blue-600 accent
        brand: {
          navy: '#0f1c3f',
          navyLight: '#16234f',
        },
      },
    },
  },
  plugins: [],
};
