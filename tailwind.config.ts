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
        gold: {
          950: '#F59E0B',
          900: '#D97706',
          800: '#B45309',
          600: '#D97706',
          500: '#F59E0B',
        },
        support: '#FFFFFF',
        midnight: {
          950: '#FFFFFF',
          900: '#F8F9FA',
          800: '#F1F3F4',
          700: '#E8EAED',
          600: '#DADCE0',
          400: '#9CA3AF',
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
          100: '#DBEAFE',
          800: '#1E40AF',
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
