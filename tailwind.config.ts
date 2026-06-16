import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './context/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        verde: '#1A6B2F',
        verde2: '#27AE60',
        'verde-claro': '#EDF7EE',
        oro: '#D4A017',
        gris: '#5a6b5e',
        linea: '#dfe8e1',
        exacto: '#1A6B2F',
        resultado: '#27AE60',
        acierto: '#9CCC65',
        fallo: '#cfd8d2',
        bg: '#f4f8f5',
        card: '#ffffff',
        texto: '#16271c',
      },
    },
  },
  plugins: [],
};
export default config;
