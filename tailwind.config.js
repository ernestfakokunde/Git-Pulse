/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        gp: {
          canvas: "#050606",
          surface: "#111113",
          card: "#0B2118",
          cardSoft: "#0D2B1F",
          border: "#313239",
          muted: "#A7AEC4",
          neon: "#00E884",
          neonDim: "#0B6A43",
          danger: "#FF3D00",
          dangerBg: "#2A0D06",
          hot: "#FF3B72",
          white: "#F8FAFC",
        },
      },
    },
  },
  plugins: [],
};
