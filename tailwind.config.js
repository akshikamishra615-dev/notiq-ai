import plugin from 'tailwindcss/plugin';

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
          purple: '#6C3BFF',
          'purple-dark': '#5528DB',
          'purple-light': '#8A5FFF',
          pink: '#FF6FB5',
          'pink-dark': '#E64D98',
          'pink-light': '#FF94CC',
        },
        sticky: {
          yellow: '#FEF08A',
          'yellow-dark': '#EAB308',
          pink: '#FBCFE8',
          'pink-dark': '#EC4899',
          purple: '#DDD6FE',
          'purple-dark': '#8B5CF6',
          blue: '#BAE6FD',
          'blue-dark': '#0284C7',
          green: '#BBF7D0',
          'green-dark': '#16A34A',
          orange: '#FED7AA',
          'orange-dark': '#EA580C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
        handwriting: ['Caveat', 'Patrick Hand', 'cursive', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'sticky': '18px',
        'xl': '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(108, 59, 255, 0.12)',
        'glass-hover': '0 12px 40px 0 rgba(108, 59, 255, 0.22)',
        'sticky': '2px 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.06)',
        'sticky-lift': '4px 12px 24px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0,0,0,0.08)',
        'glow-purple': '0 0 25px rgba(108, 59, 255, 0.45)',
        'glow-pink': '0 0 25px rgba(255, 111, 181, 0.45)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6C3BFF 0%, #FF6FB5 100%)',
        'gradient-brand-subtle': 'linear-gradient(135deg, rgba(108, 59, 255, 0.08) 0%, rgba(255, 111, 181, 0.08) 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0D0B18 0%, #15102A 100%)',
      }
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant('light', 'html.light &');
    }),
  ],
}
