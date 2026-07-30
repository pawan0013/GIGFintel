export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT:'#08122a', 2:'#0e1c3a', 3:'#162248' },
        gold: { DEFAULT:'#c9a050', 2:'#e8bc6a', dim:'rgba(201,160,80,0.12)' },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"','system-ui','sans-serif'], mono: ['"JetBrains Mono"','monospace'] }
    }
  },
  plugins: []
}
