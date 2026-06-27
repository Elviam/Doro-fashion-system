/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lila: "#E7D6FF",
        "lila-mid": "#A68DC8",
        "lila-soft": "#C9B8E8",
        oscuro: "#2C2A48",
        "oscuro-card": "#221E3A",
        "bg-card": "#231E3C",
        blanco: "#FFFFFF",
        "text-muted": "#5A5870",
        verde: "#A3E378",
        rojo: "#FF6B6B",
        amarillo: "#F7CB57",
        azul: "#7EC9ED",
        rosa: "#ED8ABA",
        naranja: "#FAA86B",
      },
    },
  },
  plugins: [],
}