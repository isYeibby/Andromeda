/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // === DEEP SLATE BACKGROUNDS ===
        slate: {
          deep: '#020617',
          dark: '#0f172a',
          mid: '#1e293b',
          soft: '#334155',
        },
        // === NEON ACCENTS (0% green / 0% amber) ===
        accent: {
          fuchsia: '#d946ef',
          cyan: '#38bdf8',
          red: '#f43f5e',
          rose: '#e11d48',
        },
        // === LIGHT MODE (NERV / LABORATORY) ===
        nerv: {
          bg: '#f1f5f9',
          surface: '#e2e8f0',
          border: '#cbd5e1',
          text: '#0f172a',
          muted: '#64748b',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
        display: ['"Outfit"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan': 'scan 8s linear infinite',
        'glitch': 'glitch 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.3)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%, 90%, 100%': { transform: 'translate(0)' },
          '92%': { transform: 'translate(-2px, 1px)' },
          '94%': { transform: 'translate(2px, -1px)' },
          '96%': { transform: 'translate(-1px, -2px)' },
          '98%': { transform: 'translate(1px, 2px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'neon-fuchsia': '0 0 10px rgba(217, 70, 239, 0.3), 0 0 40px rgba(217, 70, 239, 0.1)',
        'neon-cyan': '0 0 10px rgba(56, 189, 248, 0.3), 0 0 40px rgba(56, 189, 248, 0.1)',
        'neon-red': '0 0 10px rgba(244, 63, 94, 0.3), 0 0 40px rgba(244, 63, 94, 0.1)',
        'neon-rose': '0 0 10px rgba(225, 29, 72, 0.3), 0 0 40px rgba(225, 29, 72, 0.1)',
      },
    },
  },
  plugins: [],
};
