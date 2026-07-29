// Shared UI primitives
export function Badge({ children, type = 'default' }) {
  const styles = {
    invest: 'bg-green-500/15 text-green-400 border border-green-500/30',
    pass: 'bg-red-500/15 text-red-400 border border-red-500/30',
    watch: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    high: 'bg-green-500/15 text-green-400 border border-green-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    low: 'bg-red-500/15 text-red-400 border border-red-500/30',
    default: 'bg-white/10 text-white/60 border border-white/15'
  }
  const k = children?.toLowerCase()
  const s = styles[k] || styles.default
  return <span className={`inline-flex items-center text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${s}`}>{children}</span>
}

export function Pill({ children }) {
  return <span className="inline-flex items-center text-[9px] text-white/40 px-2 py-0.5 rounded border border-white/10">{children}</span>
}

export function Card({ children, className = '' }) {
  return <div className={`bg-navy-2 border border-white/10 rounded-xl ${className}`}>{children}</div>
}

export function Label({ children }) {
  return <div className="text-[9px] font-bold tracking-[0.12em] uppercase text-gold mb-1 inline-flex items-center gap-1.5 bg-gold/10 border border-gold/20 px-2 py-1 rounded">{children}</div>
}

export function Input({ label, ...props }) {
  return (
    <div>
      {label && <p className="text-[10px] font-medium text-white/50 mb-1">{label}</p>}
      <input className="w-full bg-navy-3 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none transition-colors placeholder:text-white/20" {...props}/>
    </div>
  )
}

export function Textarea({ label, ...props }) {
  return (
    <div>
      {label && <p className="text-[10px] font-medium text-white/50 mb-1">{label}</p>}
      <textarea className="w-full bg-navy-3 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none transition-colors placeholder:text-white/20 resize-none font-sans" {...props}/>
    </div>
  )
}

export function Button({ children, variant = 'primary', loading, className = '', ...props }) {
  const base = 'flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-wait px-4 py-2.5'
  const variants = {
    primary: 'bg-gold text-navy hover:bg-gold-2 w-full',
    secondary: 'bg-white/8 text-white/70 hover:bg-white/12 hover:text-white border border-white/10',
    danger: 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/25'
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>}
      {children}
    </button>
  )
}

export function ScoreBar({ score }) {
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono font-bold text-xl" style={{color}}>{score}</span>
      <span className="text-white/30 text-xs">/100</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{width: score+'%', background: color}}/>
      </div>
    </div>
  )
}

export function ConfidenceFlag({ level, note }) {
  const map = { High: 'bg-green-500/15 text-green-400 border-green-500/30', Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30', Low: 'bg-red-500/15 text-red-400 border-red-500/30' }
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${map[level] || map.Medium}`}>
      <span className="font-bold uppercase text-[9px] tracking-wider">{level} CONFIDENCE</span>
      {note && <span className="opacity-70">— {note}</span>}
    </div>
  )
}

export function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 my-3">
      <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-white/30">{children}</span>
      <div className="flex-1 h-px bg-white/8"/>
    </div>
  )
}

export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'
  return <div className={`${s} border-2 border-gold border-t-transparent rounded-full animate-spin`}/>
}

export function Empty({ title, subtitle, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-4xl mb-4 opacity-30">{icon}</div>}
      <p className="text-white/40 font-medium mb-1">{title}</p>
      {subtitle && <p className="text-white/25 text-sm">{subtitle}</p>}
    </div>
  )
}
