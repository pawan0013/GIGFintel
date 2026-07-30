export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  safelist: [
    // Core layout
    'h-screen','flex','overflow-hidden','flex-col','flex-1','min-w-0',
    'fixed','inset-y-0','left-0','z-50','w-52','flex-shrink-0',
    'translate-x-0','-translate-x-full','lg:translate-x-0','lg:static','lg:z-auto',
    // Navy backgrounds (now mapped to dark forest green)
    'bg-navy','bg-navy-2','bg-navy-3',
    // Gold accents (now mapped to leaf green)
    'bg-gold','text-gold','border-gold',
    'bg-gold/10','bg-gold/15','bg-gold/20','bg-gold/8','bg-gold/5',
    'text-gold/70','text-gold/60','text-gold/80',
    'border-gold/20','border-gold/25','border-gold/30',
    'hover:bg-gold','hover:bg-gold-2','hover:bg-gold/15',
    'text-navy',
    // White/opacity
    'text-white','text-white/50','text-white/40','text-white/30','text-white/60','text-white/70',
    'text-white/25','text-white/35','text-white/20','text-white/65','text-white/80','text-white/55',
    'bg-white/3','bg-white/4','bg-white/5','bg-white/6','bg-white/8','bg-white/2',
    'border-white/8','border-white/10','border-white/15','border-white/5',
    // Colors
    'text-green-400','bg-green-500/15','border-green-500/25',
    'text-red-400','bg-red-500/15','border-red-500/25','bg-red-500/8','border-red-500/20',
    'text-amber-400','bg-amber-500/15','border-amber-500/25','bg-amber-500/6','border-amber-500/20',
    'text-blue-400','bg-blue-500/15','border-blue-500/25',
    'text-purple-400','bg-purple-500/15','border-purple-500/25',
    'text-cyan-400','bg-cyan-500/15','border-cyan-500/25',
    // Spacing
    'px-4','px-5','px-6','px-8','px-3','px-2',
    'py-2','py-3','py-4','py-5','py-6','py-7',
    'p-3','p-4','p-5','p-8',
    'mb-1','mb-2','mb-3','mb-4','mb-5','mb-6','mt-1','mt-2','mt-3','mt-4','mt-5',
    'gap-2','gap-3','gap-4','gap-5',
    // Typography
    'text-xs','text-sm','text-base','text-2xl','text-4xl','text-xl',
    'font-bold','font-semibold','font-mono','font-medium',
    'tracking-tight','tracking-widest','tracking-wider',
    'leading-none','leading-tight','leading-relaxed',
    // Border radius
    'rounded','rounded-lg','rounded-xl','rounded-2xl','rounded-full',
    // Other
    'border','border-b','border-r','border-r-2',
    'overflow-y-auto','overflow-hidden',
    'transition-all','transition-colors','duration-150','duration-200',
    'hover:bg-white/4','hover:bg-white/2','hover:text-white','hover:text-white/60','hover:text-white/70','hover:text-white/80',
    'hidden','min-h-screen',
    'w-full','w-8','w-7','w-4','w-3','w-2','w-1.5',
    'h-full','h-8','h-7','h-4','h-3','h-2','h-1.5',
    'animate-spin','animate-pulse',
    'disabled:opacity-40','disabled:opacity-50','disabled:cursor-not-allowed','disabled:cursor-wait',
    'resize-none','cursor-pointer','cursor-not-allowed',
    'grid','grid-cols-2','grid-cols-3',
    'space-y-2','space-y-3','space-y-4','space-y-5',
    'items-center','items-start','justify-between','justify-center',
    'lg:hidden','lg:translate-x-0','lg:static',
    'max-w-[1500px]','mx-auto',
    'last:border-0','last:pb-0',
    'text-[9px]','text-[10px]','text-[8px]','text-[13px]',
    'border-t','border-t-transparent',
    'min-h-[500px]','min-h-[600px]',
    'flex-wrap','flex-shrink-0',
    'uppercase','lowercase',
    'bg-[#0a1f0f]','bg-[#0f2d17]',
    'w-12','h-12','w-6','h-6',
    'p-1','p-2',
    'opacity-40','opacity-50',
    'inset-0','z-40',
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT:'#0a1f0f', 2:'#0f2d17', 3:'#163d20' },
        gold: { DEFAULT:'#4a9e6b', 2:'#5fb97f', dim:'rgba(74,158,107,0.12)' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"','system-ui','sans-serif'],
        mono: ['"JetBrains Mono"','monospace']
      }
    }
  },
  plugins: []
}
