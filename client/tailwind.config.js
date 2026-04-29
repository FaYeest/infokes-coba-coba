/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: {
          950: "var(--notion-bg)",
          900: "var(--notion-gray)",
          850: "var(--notion-hover)",
          800: "var(--notion-border)",
          700: "var(--notion-border-dark)"
        },
        notion: {
          bg: "var(--notion-bg)",
          text: "var(--notion-text)",
          border: "var(--notion-border)",
          gray: "var(--notion-gray)",
          green: "#69986E",
          subtext: "var(--notion-subtext)",
          light: "var(--notion-text-light)",
          hover: "var(--notion-hover)",
          borderDark: "var(--notion-border-dark)",
          yellow: "#E6B800",
          blue: "#2EAADC",
          blueHover: "#2094C3"
        },
        mac: {
          red: "#FF5F57",
          yellow: "#FEBC2E",
          green: "#28C840",
          redBorder: "#E0443E",
          yellowBorder: "#D89E24",
          greenBorder: "#1AAB29"
        },
        brandAccent: "#69986E",
        blueAccent: "#2EAADC"
      },
      boxShadow: {
        panel: "var(--box-shadow)",
        panelThick: "var(--box-shadow-thick)"
      }
    }
  },
  plugins: []
};
