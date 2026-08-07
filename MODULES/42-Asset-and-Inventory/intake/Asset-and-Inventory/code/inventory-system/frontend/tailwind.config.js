/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7f0",
          100: "#d5ecda",
          200: "#a9d9b6",
          300: "#7bc491",
          400: "#4ea86c",
          500: "#2f8a52",
          600: "#1f7a44",
          700: "#145c33",
          800: "#0f4a28",
          900: "#0a3a1f",
          950: "#062e18",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px 0 rgba(16, 24, 40, 0.04)",
      },
    },
  },
  plugins: [],
};
