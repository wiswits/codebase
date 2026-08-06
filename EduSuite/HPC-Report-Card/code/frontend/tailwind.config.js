/** @type {import('tailwindcss').Config} */

export default {

  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
theme: {
  extend: {
    colors: {
      primary: "#0B1F51",
      secondary: "#D4AF37",

      background: "#F8F5EF",
      surface: "#FFFFFF",

      success: "#10B981",
      warning: "#F59E0B",
      danger: "#EF4444",
      info: "#3B82F6",

      text: {
        primary: "#0B1F51",
        secondary: "#64748B",
      },
    },

    borderRadius: {
      xl: "16px",
      "2xl": "22px",
    },

    boxShadow: {
      card: "0 10px 30px rgba(15,23,42,.08)",
      hover: "0 20px 40px rgba(15,23,42,.12)",
    },
  },
},

  plugins: [],

};