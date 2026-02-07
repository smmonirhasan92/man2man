/** @type {import('tailwindcss').Config} */
const colors = require('./theme/colors');

module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: colors.primary,
                secondary: colors.text.secondary,
                accent: colors.accent,
                gold: colors.primary.DEFAULT,
                background: colors.background,
                ...colors, // Flatten rest for utilities like text-gold
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'premium-dark': `linear-gradient(to bottom, ${colors.background.DEFAULT}, ${colors.background.paper})`,
                'gold-sheen': `linear-gradient(45deg, ${colors.primary.dark}, ${colors.primary.DEFAULT}, ${colors.primary.light}, ${colors.primary.dark})`,
                'card-gradient': `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'pulse-gold': 'pulse-gold 2s infinite',
                'float': 'float 3s ease-in-out infinite',
                'scale-up': 'scale-up 0.2s ease-out forwards',
            },
            keyframes: {
                'pulse-gold': {
                    '0%, 100%': { boxShadow: `0 0 0 0 ${colors.primary.DEFAULT}66` }, // 40% opacity
                    '50%': { boxShadow: `0 0 0 10px ${colors.primary.DEFAULT}00` }, // 0% opacity
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'scale-up': {
                    '0%': { transform: 'scale(0.95)', opacity: '0.8' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}
