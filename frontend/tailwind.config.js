/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in-left': 'fade-in-left 0.8s ease-out both',
        'fade-in-right': 'fade-in-right 0.8s ease-out both',
        'shake': 'shake 0.5s ease-in-out',
        'bounce': 'bounce 2s infinite',
      },
      keyframes: {
        'fade-in-left': {
          'from': {
            opacity: '0',
            transform: 'translateX(-50px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        'fade-in-right': {
          'from': {
            opacity: '0',
            transform: 'translateX(50px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
        }
      }
    },
  },
  plugins: [],
}