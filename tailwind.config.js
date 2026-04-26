/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Excalibur dark theme palette
        // Abyss Elite Palette
        surface: {
          base:    '#030303', // Deep Abyss
          raised:  '#080808',
          overlay: '#0c0c0c',
          float:   '#111111',
          glass:   'rgba(5, 5, 5, 0.7)',
        },
        border: {
          subtle:  'rgba(255, 255, 255, 0.04)',
          default: 'rgba(255, 255, 255, 0.08)',
          strong:  'rgba(255, 255, 255, 0.15)',
        },
        accent: {
          purple: '#a855f7', // Electric Purple
          cyan:   '#06b6d4', // Neon Cyan
          green:  '#10b981',
          orange: '#f59e0b',
          red:    '#ef4444',
          pink:   '#ec4899',
        },
        text: {
          primary:   '#ffffff',
          secondary: '#a1a1aa', // Zinc 400
          muted:     '#52525b', // Zinc 600
          accent:    '#d8b4fe',
        },
      },
      fontFamily: {
        sans: ['"Inter var"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'full': '9999px',
      },
      animation: {
        'pulse-slow':    'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':       'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up':      'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down':    'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'blink':         'blink 1s step-end infinite',
        'spin-slow':     'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        blink:     { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
      },
      boxShadow: {
        'glow-purple': '0 0 40px rgba(168, 85, 247, 0.15)',
        'glow-cyan':   '0 0 40px rgba(6, 182, 212, 0.15)',
        'glass':       '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
        'soft':        '0 2px 10px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
