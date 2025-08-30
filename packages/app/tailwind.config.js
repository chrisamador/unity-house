/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          50: '#EBF2FF',
          100: '#D6E4FF',
          200: '#A9C9FF',
          300: '#7CABFF',
          400: '#4F8EFF',
          500: '#3B82F6',
          600: '#0B5CD5',
          700: '#084BAF',
          800: '#063A89',
          900: '#042A63',
        },
        secondary: {
          DEFAULT: '#10B981',
          50: '#E6FFF6',
          100: '#CCFFED',
          200: '#99FFD6',
          300: '#66FFBF',
          400: '#33FFA8',
          500: '#10B981',
          600: '#0C9D6B',
          700: '#098254',
          800: '#06663E',
          900: '#034A2D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
