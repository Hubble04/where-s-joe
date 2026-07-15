import type { Config } from 'tailwindcss';

/**
 * Where's Joe? — brand design tokens
 * Palette (from brand spec):
 *   green   #19452B  primary — buttons, nav, accents, stamps
 *   ivory   #FDFAED  background
 *   coffee  #502A19  typography accents / depth
 *   gold    #5C4E19  verified / premium detail (olive-gold)
 *   navy    #1B3A73  depth / contrast / supporting
 *   amber   #B96912  warm active accents (Bean, likes, selected, Sipped)
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        racing: {
          DEFAULT: '#19452B',
          50: '#EEF3EF',
          100: '#D6E2DA',
          200: '#AEC6B7',
          300: '#7FA48D',
          400: '#4E7A61',
          500: '#2E5B41',
          600: '#19452B',
          700: '#143823',
          800: '#0F2B1B',
          900: '#0A1D12',
        },
        ivory: {
          DEFAULT: '#FDFAED',
          50: '#FFFEFB',
          100: '#FDFAED',
          200: '#F6F0DC',
          300: '#EFE7C9',
        },
        coffee: {
          DEFAULT: '#502A19',
          light: '#7A4A31',
          dark: '#3A1D10',
        },
        gold: {
          DEFAULT: '#5C4E19',
          light: '#8A7526',
          soft: '#B8A15A',
        },
        navy: {
          DEFAULT: '#1B3A73',
          light: '#33578F',
          dark: '#132A54',
        },
        amber: {
          DEFAULT: '#B96912',
          light: '#D5822B',
          soft: '#E9A85A',
          dark: '#8F4F0C',
        },
        parchment: '#EFE9D6',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        heading: ['var(--font-heading)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '1.25rem',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(80,42,25,0.04), 0 6px 20px -8px rgba(25,69,43,0.14)',
        lift: '0 8px 30px -10px rgba(25,69,43,0.28)',
        stamp: '0 2px 10px -4px rgba(80,42,25,0.35)',
      },
      letterSpacing: {
        eyebrow: '0.22em',
      },
      keyframes: {
        'stamp-in': {
          '0%': { opacity: '0', transform: 'scale(1.4) rotate(var(--stamp-rot,-6deg))' },
          '60%': { opacity: '1' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(var(--stamp-rot,-6deg))' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'stamp-in': 'stamp-in 0.5s cubic-bezier(0.2,0.8,0.2,1) both',
        'fade-up': 'fade-up 0.4s ease both',
      },
    },
  },
  plugins: [],
};
export default config;