/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        glacier: {
          50:'#f0faff', 100:'#ddf3ff', 200:'#c0eaff',
          300:'#A8E6FF', 400:'#7dd4f5', 500:'#4bbee8',
          600:'#2da3cf', 700:'#1a84ae', 800:'#0d6a8e', 900:'#064e6a',
        },
        navy: {
          950:'#001020', 900:'#001828', 800:'#042030',
          700:'#082035', 600:'#0d2a42', 500:'#153450',
        },
      },
      fontFamily: {
        sans: ['Inter','system-ui','sans-serif'],
        mono: ['JetBrains Mono','monospace'],
      },
    },
  },
  plugins: [],
}
