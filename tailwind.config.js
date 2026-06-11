/** @type {import('tailwindcss').Config} */
module.exports = {
  // Le point "./" est requis pour cibler la racine locale de vos dossiers
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")], 
  theme: {
    extend: {},
  },
  plugins: [],
}
