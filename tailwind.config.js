/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,tsx,ts}", "./*.html"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#F59E0B",
        accent: "#10B981",
        bgLight: "#F8FAFC",
        bgDark: "#1E293B",
        textBase: "#1F2937",
        textInverse: "#F1F5F9",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
