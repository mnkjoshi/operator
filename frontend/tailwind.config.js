/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clarity Design System - WCAG 2.2 AAA Compliant
        clarity: {
          dark: {
            canvas: '#121212',
            text: '#FFFFFF',
          },
          light: {
            canvas: '#FAFAFA',
            text: '#000000',
          },
          focus: '#FFB000', // Amber for focus states and listening indicator
        },
      },
      fontFamily: {
        // Atkinson Hyperlegible font
        sans: ['Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Baseline 18px, scalable to 300%
        base: ['18px', { lineHeight: '1.5' }],
      },
      lineHeight: {
        'clarity': '1.5', // 1.5x standard for readability
      },
      spacing: {
        // Minimum touch target: 48x48px
        'touch': '48px',
      },
    },
  },
  plugins: [],
}
