/** @type {import('tailwindcss').Config} */

const BREAKPOINTS = {
  xs: 286, // iPhone SE
  sm: 380, // iPhone 14
  md: 768, // iPad mini, Desktop
  lg: 1024, // iPad, Desktop
  xl: 1264, // Desktop
}

module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#49291b',
          100: '#0f0806',
          200: '#1e110b',
          300: '#2d1911',
          400: '#3c2116',
          500: '#49291b',
          600: '#864b32',
          700: '#bd6e4c',
          800: '#d39e88',
          900: '#e9cfc3',
        },
        secondary: {
          DEFAULT: '#502d1e',
          100: '#100906',
          200: '#21120c',
          300: '#311c13',
          400: '#412519',
          500: '#502d1e',
          600: '#8b4f35',
          700: '#bd7252',
          800: '#d3a18c',
          900: '#e9d0c5',
        },
      },
      fontFamily: {
        sans: ["montserrat-regular"],
        montserrat: ["montserrat-regular", "sans-serif"],
        "montserrat-italic": ["montserrat-italic", "sans-serif"],
        "montserrat-bold": ["montserrat-bold", "sans-serif"],
        "montserrat-bold-italic": ["montserrat-bold-italic", "sans-serif"],
        "montserrat-medium": ["montserrat-medium", "sans-serif"],
        "montserrat-medium-italic": ["montserrat-medium-italic", "sans-serif"],
        "montserrat-light": ["montserrat-light", "sans-serif"],
        "montserrat-light-italic": ["montserrat-light-italic", "sans-serif"],
        "montserrat-semibold": ["montserrat-semibold", "sans-serif"],
        "montserrat-semibold-italic": ["montserrat-semibold-italic", "sans-serif"],
        "montserrat-extrabold": ["montserrat-extrabold", "sans-serif"],
        "montserrat-extrabold-italic": ["montserrat-extrabold-italic", "sans-serif"],
        "montserrat-black": ["montserrat-black", "sans-serif"],
        "montserrat-black-italic": ["montserrat-black-italic", "sans-serif"],
      },
      screens: {
        xs: BREAKPOINTS.xs + "px",
        sm: BREAKPOINTS.sm + "px",
        md: BREAKPOINTS.md + "px",
        lg: BREAKPOINTS.lg + "px",
        xl: BREAKPOINTS.xl + "px",
      },
    },
  },
  plugins: [],
};
