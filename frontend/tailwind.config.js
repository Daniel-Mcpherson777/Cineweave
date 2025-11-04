/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          purple: '#8B5CF6',
          red: '#EF4444',
          blue: '#3B82F6',
        },
        background: {
          dark: '#0F172A',
          medium: '#1E293B',
          light: '#334155',
        },
      },
      backgroundImage: {
        'gradient-cinematic': 'linear-gradient(135deg, #8B5CF6 0%, #EF4444 50%, #3B82F6 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      },
    },
  },
  plugins: [],
}
