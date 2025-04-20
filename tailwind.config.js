import colors from 'tailwindcss/colors';
/** @type {import('tailwindcss').Config} */
export default {
  presets: [
    require('@paolojulian.dev/design-system/tailwind-config/tailwind.config.ts'),
  ],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors,
      keyframes: {
        flashSuccess: {
          '0%': {
            backgroundColor: 'unset',
          },
          '20%, 80%': {
            backgroundColor: '#22c55e22',
          },
          '100%': {
            backgroundColor: 'unset',
          },
        },
        pingButton: {
          '0%': {
            transform: 'scale(1)',
          },
          '20%, 80%': {
            transform: 'scale(1.2)',
          },
          '100%': {
            transform: 'scale(1)',
          },
        },
      },
      animation: {
        flashSuccess: 'flashSuccess 2s ease-in-out',
        pingButton: 'pingButton 100ms ease-in-out',
      },
    },
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
