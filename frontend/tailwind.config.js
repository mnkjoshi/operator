/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clarity: {
          dark: {
            canvas: '#1e1e1e',
            text: '#cccccc',
          },
          light: {
            canvas: '#FAFAFA',
            text: '#000000',
          },
          focus: '#007acc',
        },
      },
      fontFamily: {
        sans: [
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"SF Pro Icons"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        base: ['17px', { lineHeight: '1.55' }],
      },
      lineHeight: {
        'clarity': '1.55',
      },
      spacing: {
        // Minimum touch target: 48x48px
        'touch': '48px',
      },
    },
  },
  plugins: [],
}
