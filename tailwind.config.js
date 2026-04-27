/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0F172A",
        midnight: "#1A1F3A",
        cyan: "#00D9FF",
        purple: "#9D4EDD",
        lavender: "#E0AAFF",
        neon: "#39FF14"
      },
      borderRadius: {
        glass: "20px"
      },
      boxShadow: {
        glass: "0 8px 40px rgba(0, 217, 255, 0.16)"
      },
      backgroundImage: {
        aurora: "linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)"
      }
    }
  },
  plugins: []
};