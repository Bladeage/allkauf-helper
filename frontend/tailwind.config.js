/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ea580c',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          500: '#ea580c',
          600: '#dc4f08',
          700: '#c2410c',
          800: '#9a3412',
        },
      },
    },
  },
  plugins: [],
};
