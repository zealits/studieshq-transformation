/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#6B81FF", // Light blue from logo
          DEFAULT: "#3F51B5", // Medium blue
          dark: "#303F9F", // Darker blue
        },
        secondary: {
          light: "#FF9E80", // Light orange from logo
          DEFAULT: "#FF5722", // Medium orange
          dark: "#E64A19", // Dark orange
        },
        accent: {
          light: "#FF8A80",
          DEFAULT: "#FF5252", // Pink from logo
          dark: "#D50000",
        },
        success: "#4CAF50",
        warning: "#FFC107",
        error: "#F44336",
        background: {
          light: "#F5F7FF",
          dark: "#1A1A2E",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 6px rgba(0, 0, 0, 0.1)",
        "card-hover": "0 10px 15px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
