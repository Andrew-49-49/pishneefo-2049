/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand blues (ported verbatim from the former CDN config in index.html)
        sky: {
          50: '#F5FBFF', 100: '#E5F5FF', 200: '#C9E9FB', 300: '#A0D5F5',
          400: '#69B8E6', 500: '#3D91D4', 600: '#2375BE', 700: '#135DAE',
          800: '#0D4D99', 900: '#0A4084', 950: '#06376F',
        },
        // NOTE: `cyan` is remapped to the brand YELLOW accent (#FFD43B).
        // This is intentional and matches the original config — `bg-cyan-400`
        // renders yellow, not cyan.
        cyan: {
          50: '#FFFCEB', 100: '#FFF6C7', 200: '#FFE98B', 300: '#FFDC55',
          400: '#FFD43B', 500: '#F5C514', 600: '#D8A900', 700: '#AF8600',
          800: '#866600', 900: '#654D00', 950: '#3A2D00',
        },
      },
    },
  },
  plugins: [],
};
