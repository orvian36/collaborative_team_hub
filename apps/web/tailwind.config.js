/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm-tinted slate. Backgrounds carry a hint of indigo so neutrals
        // never read as cool gray.
        ink: {
          50: '#f7f7f9',
          100: '#eeeef2',
          200: '#dcdde4',
          300: '#b9bcc8',
          400: '#878a9a',
          500: '#5b5e6f',
          600: '#3f4252',
          700: '#2c2e3c',
          800: '#1d1f2b',
          900: '#13141d',
          950: '#0a0b12',
        },
        // Indigo-violet primary. More distinct than corporate blue,
        // still trustworthy. Same name kept for compat.
        primary: {
          50: '#f1f1ff',
          100: '#e4e4ff',
          200: '#cdcdff',
          300: '#a8a6ff',
          400: '#8079ff',
          500: '#5d50fa',
          600: '#4a3aef',
          700: '#3e2dd1',
          800: '#3327a8',
          900: '#2c2585',
          950: '#1b154e',
        },
        // Single warm accent, used sparingly on landing.
        accent: {
          50: '#fff8eb',
          100: '#ffeac6',
          200: '#ffd488',
          300: '#ffb84a',
          400: '#ff9b1f',
          500: '#f57c06',
          600: '#d95c01',
          700: '#b34204',
          800: '#92340c',
          900: '#782c0e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      fontSize: {
        // Tighter display scale for landing
        'display-2xl': ['clamp(3rem, 8vw, 5.5rem)', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display-xl': ['clamp(2.25rem, 5vw, 3.5rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(1.75rem, 3.5vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(13,14,28,0.06), 0 1px 1px rgba(13,14,28,0.04)',
        lift: '0 12px 32px -12px rgba(13,14,28,0.18), 0 2px 4px rgba(13,14,28,0.04)',
        ring: '0 0 0 1px rgba(13,14,28,0.06)',
        'glow-primary': '0 0 0 1px rgba(93,80,250,0.4), 0 12px 32px -8px rgba(93,80,250,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up-soft': 'slideUp 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
        marquee: 'marquee 38s linear infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-light':
          'linear-gradient(to right, rgba(13,14,28,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(13,14,28,0.06) 1px, transparent 1px)',
        'grid-dark':
          'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
