/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderWidth: {
        '3': '3px',
      },
      colors: {
        blurple: {
          DEFAULT: '#5865F2',
          hover: '#4752C4',
          light: '#7983F5',
        },
        discord: {
          darkest: '#111214',
          darker: '#1e1f22',
          dark: '#2b2d31',
          surface: '#313338',
          hover: '#383a40',
          active: '#404249',
          border: '#3f4147',
          muted: '#949ba4',
          text: '#dbdee1',
          heading: '#f2f3f5',
          green: '#23a55a',
          yellow: '#f0b232',
          red: '#f23f43',
        },
      },
    },
  },
  plugins: [],
};
