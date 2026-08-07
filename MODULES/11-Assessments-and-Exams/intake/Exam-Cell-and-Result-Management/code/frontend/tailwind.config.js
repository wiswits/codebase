/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f4',
          100: '#dbf0e3',
          200: '#b8e1c9',
          300: '#8ccca9',
          400: '#5cb187',
          500: '#3FA46A',
          600: '#328758',
          700: '#296c47',
          800: '#23573b',
          900: '#1e4832',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 10px 0 rgba(15, 23, 42, 0.06)',
        card: '0 4px 24px -4px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        xl: '0.85rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
