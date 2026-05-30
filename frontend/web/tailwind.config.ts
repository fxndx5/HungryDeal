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
        brand: {
          50:  '#f0f7f7',
          100: '#d0e6e6',
          200: '#a3cccc',
          300: '#70adad',
          400: '#4d9090',
          500: '#2D6F6F',
          600: '#255c5c',
          700: '#1d4949',
          800: '#153636',
          900: '#0d2323',
        },
        accent: {
          50:  '#fdf8eb',
          100: '#f9edcc',
          300: '#e8c76a',
          400: '#D4A843',
          500: '#c49a38',
          600: '#a8832e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}

export default config
