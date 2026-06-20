/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bbdffa',
          300: '#7cc2f7',
          400: '#36a2f1',
          500: '#0c85dd',
          600: '#0267ba',
          700: '#035296',
          800: '#07467d',
          900: '#0c3b68',
          950: '#082545',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
