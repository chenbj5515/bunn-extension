import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config = {
    darkMode: ["class"],
    content: [
        './src/**/*.{ts,tsx,html}',
    ],
    theme: {
        extend: {
            transitionProperty: {
                'stroke': 'stroke-dasharray, stroke-dashoffset',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'dark-border': 'linear-gradient(163deg, #00ff75 0%, #3700ff 100%)'
            },
            boxShadow: {
                crescent: 'inset 8px -4px 0px 0px #fff000',
                'full-moon': 'inset 15px -4px 0px 15px #fff000',
                'dark-shadow': '0px 0px 10px 1px #000000ee',
                'little-button': '0.1em 0.1em',
                'poster': '8px 8px 10px #a0a0a0',
                'neumorphic': '2px 2px 4px #bebebe, -4px -4px 8px #ffffff',
                'neumorphic-weak': '1px 1px 2px #bebebe, -4px -4px 8px #ffffff',
                'neumorphic-button-hover': 'inset 2px 2px 4px #bebebe, inset -4px -4px 8px #ffffff',
                buttonActive:
                    "0 12px 25px -4px rgba(0, 0, 0, 0.4), inset 0 -8px 30px 1px rgba(255, 255, 255, 0.9), 0 -10px 15px -1px rgba(255, 255, 255, 0.6), inset 0 8px 25px 0 rgba(0, 0, 0, 0.4), inset 0 0 10px 1px rgba(255, 255, 255, 0.6)",
                darkActive:
                    "0 6px 10px -4px rgba(0, 0, 0, 0.4), inset 0 -4px 10px -1px rgba(0, 0, 0, 0.2), 0 -6px 8px -1px rgba(0, 0, 0, 0.3), inset 0 4px 6px 0 rgba(0, 0, 0, 0.2), inset 0 0 2px 1px rgba(0, 0, 0, 0.3)",
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            colors: {
                bgDark: '#212121',
                eleDark: '#151515',
                black: 'rgb(26 26 26)',
                wrong: '#E50914',
                correct: 'limegreen',
                blue: '#1e07f0',
                white: 'white',
                hovered: '#f4f4f5',
                darkButtonBg: '#e6e7e8',
                darkBorderColor: '#878a8c',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            },
            maxWidth: {
                '92-675': 'min(92%, 675px)',
                '80-680': 'min(80%, 680px)',
            },
            filter: {
                blurHalf: "blur(0.5px)",
            },
            animation: {
                spinner: 'spinner 2s infinite ease',
            },
            keyframes: {
                spinner: {
                    '0%': {
                        transform: 'rotate(45deg) rotateX(-25deg) rotateY(25deg)',
                    },
                    '50%': {
                        transform: 'rotate(45deg) rotateX(-385deg) rotateY(25deg)',
                    },
                    '100%': {
                        transform: 'rotate(45deg) rotateX(-385deg) rotateY(385deg)',
                    },
                },
            },
        }
    },
    variants: {
        extend: {
            boxShadow: ["group-active"],
            filter: ["group-active"],
        },
    },
    plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;