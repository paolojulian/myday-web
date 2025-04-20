/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      zIndex: {
        'bottom-bar': '100',
        'modal': '200',
        'toasts': '999',
      }
    }
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.hide-scroll': {
          '-ms-overflow-style': 'none' /* IE and Edge */,
          'scrollbar-width': 'none' /* Firefox */,
        },
        '.hide-scroll::-webkit-scrollbar': {
          display: 'none',
        },
      });
    },
  ],
};
