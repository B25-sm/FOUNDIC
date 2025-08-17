import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0D6A62',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        accent: {
          light: '#80AAA8',
          primary: '#0D6A62',
          dark: '#054741',
        },
        support: '#FFFFFF',
        midnight: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0F172A',
        },
        success: {
          100: '#D1FAE5',
          800: '#065F46',
        },
        warning: {
          100: '#FEF3C7',
          800: '#92400E',
        },
        error: {
          100: '#FEE2E2',
          800: '#991B1B',
        },
        primary: {
          50: '#e6f7f6',
          100: '#ccefed',
          200: '#99dfdb',
          300: '#66cfc9',
          400: '#33bfb7',
          500: '#0D6A62',
          600: '#0a5551',
          700: '#084440',
          800: '#05332f',
          900: '#03221e',
          950: '#01110d',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'midnight-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'midnight-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(245, 158, 11, 0.3)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'premium-glow': 'premiumGlow 4s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out both',
        'connection-pulse': 'connectionPulse 4s ease-in-out infinite',
        'dots-flow': 'dotsFlow 3s ease-in-out infinite',
        'dot1': 'dot1 3s ease-in-out infinite',
        'dot2': 'dot2 3s ease-in-out infinite',
        'twinkle': 'twinkle 6s ease-in-out infinite',
        'earth-rotate': 'earthRotate 40s linear infinite',
        'moon-float': 'moonFloat 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        premiumGlow: {
          '0%, 100%': {
            textShadow: '0 0 15px rgba(255, 255, 255, 0.3)',
            transform: 'scale(1)',
          },
          '50%': {
            textShadow: '0 0 25px rgba(255, 255, 255, 0.5)',
            transform: 'scale(1.01)',
          },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        connectionPulse: {
          '0%, 100%': {
            opacity: '0.4',
            transform: 'translateX(-50%) scaleY(0.9)',
          },
          '50%': {
            opacity: '0.9',
            transform: 'translateX(-50%) scaleY(1.1)',
          },
        },
        dotsFlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        dot1: {
          '0%, 100%': { transform: 'translateX(-50%) translateY(0px)' },
          '50%': { transform: 'translateX(-50%) translateY(60px)' },
        },
        dot2: {
          '0%, 100%': { transform: 'translateX(-50%) translateY(0px)' },
          '50%': { transform: 'translateX(-50%) translateY(-60px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        earthRotate: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        moonFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(5deg)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
