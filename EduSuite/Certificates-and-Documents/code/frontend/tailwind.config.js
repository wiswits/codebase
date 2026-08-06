import('tailwindcss').Config 
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F2147',
          light: '#1A3A6B',
          dark: '#09152E',
        },
        secondary: {
          DEFAULT: '#C8A04E',
          light: '#DAB86E',
          dark: '#B08A3A',
        },
        background: {
          DEFAULT: '#F7F4EC',
          light: '#FBF9F5',
        },
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px rgba(15, 33, 71, 0.06)',
        'soft-hover': '0 8px 40px rgba(15, 33, 71, 0.10)',
        medium: '0 12px 48px rgba(15, 33, 71, 0.10)',
        hard: '0 20px 60px rgba(15, 33, 71, 0.15)',
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
      },
      animation: {
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease',
        'fade-in': 'fadeIn 0.2s ease',
        'bounce-in': 'bounceIn 0.5s ease',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}