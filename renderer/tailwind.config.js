/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg:       '#0a0a0f',
          surface:  '#12121a',
          border:   '#1e1e2e',
          panel:    '#0f0f18',
          accent:   '#00ff9f',
          accent2:  '#7c3aed',
          danger:   '#ff2d55',
          warn:     '#f59e0b',
          text:     '#e2e8f0',
          muted:    '#64748b',
          terminal: '#060610',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } },
      },
    },
  },
  plugins: [],
}
