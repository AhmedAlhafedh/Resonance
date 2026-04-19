/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0a0a0f',
          1: '#0f0f18',
          2: '#14141f',
          3: '#1a1a28',
          4: '#20202f',
          5: '#2a2a3d',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          default: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.18)',
        },
        accent: {
          DEFAULT: '#7c5cfc',
          soft: '#9b7dff',
          muted: 'rgba(124,92,252,0.15)',
          glow: 'rgba(124,92,252,0.3)',
        },
        emerald: {
          accent: '#10d98a',
          soft: 'rgba(16,217,138,0.15)',
        },
        amber: {
          accent: '#f59e0b',
          soft: 'rgba(245,158,11,0.15)',
        },
        rose: {
          accent: '#f43f5e',
          soft: 'rgba(244,63,94,0.15)',
        },
        sky: {
          accent: '#38bdf8',
          soft: 'rgba(56,189,248,0.15)',
        },
        text: {
          primary: '#f0f0ff',
          secondary: '#a0a0c0',
          muted: '#6060a0',
          disabled: '#404060',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-left': { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'slide-in-right': { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%, 100%': { opacity: '0.5' }, '50%': { opacity: '1' } },
        pulse: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        'spin-slow': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        'flip-in': { from: { transform: 'rotateY(90deg)', opacity: '0' }, to: { transform: 'rotateY(0deg)', opacity: '1' } },
        glow: { '0%, 100%': { boxShadow: '0 0 10px rgba(124,92,252,0.3)' }, '50%': { boxShadow: '0 0 25px rgba(124,92,252,0.6)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        pulse: 'pulse 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'flip-in': 'flip-in 0.4s ease-out',
        glow: 'glow 2s ease-in-out infinite',
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        glow: '0 0 20px rgba(124,92,252,0.25)',
        'glow-sm': '0 0 10px rgba(124,92,252,0.15)',
        panel: '0 8px 32px rgba(0,0,0,0.4)',
        card: '0 2px 8px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};
