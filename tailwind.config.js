export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT:'#0a1f0f', 2:'#0f2d17', 3:'#163d20' },
        leaf:   { DEFAULT:'#4a9e6b', 2:'#5fb97f', dim:'rgba(74,158,107,0.12)' },
        earth:  { DEFAULT:'#8b6914', 2:'#c9a050' },
        moss:   { DEFAULT:'#2d5a3d', light:'#3d7a53' },
        sky:    { DEFAULT:'#7fb8c8' },
        navy:   { DEFAULT:'#0a1f0f', 2:'#0f2d17', 3:'#163d20' },
        gold:   { DEFAULT:'#4a9e6b', 2:'#5fb97f', dim:'rgba(74,158,107,0.12)' },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"','system-ui','sans-serif'], mono: ['"JetBrains Mono"','monospace'] }
    }
  },
  plugins: []
}
