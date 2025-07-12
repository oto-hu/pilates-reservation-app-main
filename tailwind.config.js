/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': '#e3e8ed',
  				'100': '#b8c7d6',
  				'200': '#8da6be',
  				'300': '#6185a7',
  				'400': '#366490',
  				'500': '#003750', // メインカラー
  				'600': '#002e43',
  				'700': '#002536',
  				'800': '#001c29',
  				'900': '#00131c',
  				'950': '#000a0f',
  				DEFAULT: '#003750',
  				foreground: '#ffffff'
  			},
  			secondary: {
  				'50': '#f7f7f8',
  				'100': '#ededf0',
  				'200': '#d6d7db',
  				'300': '#bfc1c7',
  				'400': '#a5aaae', // セカンダリー
  				'500': '#a5aaae',
  				'600': '#8c8f92',
  				'700': '#737578',
  				'800': '#595b5c',
  				'900': '#404142',
  				'950': '#262728',
  				DEFAULT: '#a5aaae',
  				foreground: '#003750',
  				white: '#ffffff'
  			},
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
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}