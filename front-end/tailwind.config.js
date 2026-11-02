/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      maxWidth: {
        container: "1440px",
      },
      screens: {
        xs: "320px",
        sm: "375px",
        sml: "500px",
        md: "667px",
        mdl: "768px",
        lg: "960px",
        lgl: "1024px",
        xl: "1280px",
      },
      fontFamily: {
        bodyFont: ["DM Sans", "sans-serif"],
        titleFont: ["Poppins", "sans-serif"],
      },
      colors: {
        primeColor: "#0F52BA", // Updated to a modern blue
        lightText: "#6D6D6D",
        darkBg: "#1E1E1E",
        lightBg: "#F9F9F9",
        accent1: "#FF6B6B", // Accent color 1
        accent2: "#4ECDC4", // Accent color 2
        success: "#2ECC71",
        warning: "#F39C12",
        error: "#E74C3C",
      },
      boxShadow: {
        testShadow: "0px 0px 54px -13px rgba(0,0,0,0.7)",
        cardShadow: "0px 4px 15px rgba(0, 0, 0, 0.1)",
        hoverShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-in-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #0F52BA, #4ECDC4)',
        'gradient-accent': 'linear-gradient(to right, #FF6B6B, #FFD166)',
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
