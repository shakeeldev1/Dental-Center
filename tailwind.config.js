/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette derived from client/logo.png (Expert Dental Center)
        brand: {
          // Primary lime green (light figure + "DENTAL CENTER")
          green: {
            50: '#f4f9ea',
            100: '#e6f2cf',
            200: '#d0e8a6',
            300: '#b4d972',
            400: '#9ccf4f',
            500: '#8dc63f', // primary
            600: '#6ea52c',
            700: '#5e9400', // deep green (hover / emphasis)
            800: '#4a7413',
            900: '#3f6015',
          },
          // Charcoal slate (wordmark + dark figure)
          ink: {
            DEFAULT: '#3f4448',
            50: '#f5f6f6',
            100: '#e6e8e8',
            200: '#cdd0d1',
            300: '#a9adaf',
            400: '#7c8184',
            500: '#5f6467',
            600: '#4c5052',
            700: '#3f4448',
            800: '#33373a',
            900: '#26292b',
          },
        },
        surface: '#f7f7f5', // off-white app background
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
};
