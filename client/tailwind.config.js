/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F5F0', 100: '#B0E4CC', 200: '#8AD4B3', 300: '#5DBF96',
          400: '#408A71', 500: '#35755F', 600: '#285A48', 700: '#1E4537',
          800: '#143025', 900: '#091413',
        },
        secondary: {
          50: '#f5faf7', 100: '#e2f0e8', 200: '#c5d9ce', 300: '#9eb8a8',
          400: '#6d917d', 500: '#4d6b59', 600: '#3a5244', 700: '#2c3f34',
          800: '#1e2c24', 900: '#0f1a14', 950: '#091413',
        },
        success: '#408A71', warning: '#B0A84C', danger: '#E85A5A',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
