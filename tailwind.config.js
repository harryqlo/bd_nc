/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './**/*.{ts,tsx,js,jsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#60a5fa',
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
        },
        neutral: {
          light: '#f3f4f6',
          DEFAULT: '#d1d5db',
          dark: '#374151',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
