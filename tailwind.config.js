/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vms: {
          blue1: "#0B2C48",
          blue2: "#0E3857",
          blue3: "#174B73",
          ash: "#ECF2F6",
        },
      },
      boxShadow: {
        card: "0 6px 20px rgba(10,31,68,.12)",
      },
      container: { center: true, padding: "1rem" },
    },
  },
  plugins: [],
};
