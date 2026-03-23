/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1E3A5F',
          50: '#EBF0F5',
          100: '#D7E1EB',
          200: '#AFC3D7',
          300: '#87A5C3',
          400: '#5F87AF',
          500: '#3D6892',
          600: '#1E3A5F',
          700: '#172D4A',
          800: '#102035',
          900: '#091320',
        },
        risk: {
          critical: '#DC2626',
          high: '#F97316',
          medium: '#EAB308',
          low: '#22C55E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
