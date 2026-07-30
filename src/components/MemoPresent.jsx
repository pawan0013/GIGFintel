import { useState, useEffect } from 'react'
import { Badge, Pill, ScoreBar, ConfidenceFlag } from './UI'

export default function MemoPresent({ memo: m, onClose }) {
  const [idx, setIdx] = useState(0)
  const col = m.thesis_fit_score >= 70 ? '#22c55e' : m.thesis_fit_score >= 45 ? '#f59e0b' : '#ef4444'

  const slides = [
    { title: 'Executive Summary', content: (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap"><Badge>{m.recommendation}</Badge><Pill>{m.sector}</Pill><Pill>{m.stage}</Pill></div>
        <h2 className="text-3xl font-bold text-white">{m.company}</h2>
        <p className="text-white/50">{m.tagline}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30 uppercase tracking-wider">Thesis Fit</span>
          <span className="font-mono font-bold text-3xl" style={{color:col}}>{m.thesis_fit_score}/100</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full"><div className="h-full rounded-full" style={{width:m.thesis_fit_score+'%',background:col}}/></div>
        </div>
        <ConfidenceFlag level={m.confidence_level||'Medium'} note={m.confidence_note}/>
        <div className="bg-white/5 rounded-xl p-4 text-sm text-white/70 leading-relaxed">{m.executive_summary}</div>
      </div>
    )},
    { title: 'Market Opportunity', content: (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {['TAM','SAM','SOM'].map(k => <div key={k} className="bg-white/5 rounded-xl p-4"><p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{k}</p><p className="text-xl font-bold text-white">{m.market?.[k.toLowerCase()]||'—'}</p></div>)}
        </div>
        <div className="bg-gold/10 border border-gold/20 rounded-xl p-4"><p className="text-[10px] text-gold uppercase tracking-wider mb-1">Key Tailwind</p><p className="text-white/80">{m.market?.key_tailwind}</p></div>
        <p className="text-sm text-white/60 leading-relaxed">{m.product?.what_it_does}</p>
      </div>
    )},
    { title: 'Product & Team', content: (
      <div className="space-y-3">
        <div className="bg-white/5 rounded-xl p-4"><p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Moat</p><p className="text-white/80 text-sm">{m.product?.moat}</p></div>
        <div className="bg-white/5 rounded-xl p-4"><p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">vs Competitors</p><p className="text-white/80 text-sm">{m.product?.vs_competitors}</p></div>
        <div className="bg-white/5 rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><Badge>{m.team?.founder_market_fit}</Badge><span className="text-[10px] text-white/30">founder-market fit</span></div><p className="text-white/70 text-sm">{m.team?.assessment}</p></div>
      </div>
    )},
    { title: 'Key Risks', content: (
      <div className="space-y-3">
        {(m.risks||[]).map((r,i) => <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-4"><Badge>{r.severity}</Badge><div><p className="text-white/80 font-medium text-sm">{r.description}</p><p className="text-white/40 text-xs mt-1">{r.mitigant}</p></div></div>)}
      </div>
    )},
    { title: 'Recommendation', content: (
      <div className="space-y-3">
        <div className="bg-gold/10 border border-gold/20 rounded-xl p-4"><Badge>{m.recommendation}</Badge><p className="text-white/70 text-sm leading-relaxed mt-3">{m.recommendation_rationale}</p></div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider">Diligence Questions</p>
        {(m.diligence_questions||[]).map((q,i) => <div key={i} className="flex gap-3 py-2 border-b border-white/5 last:border-0"><span className="font-mono text-[10px] text-gold font-bold flex-shrink-0">Q{i+1}</span><span className="text-white/70 text-sm">{q}</span></div>)}
      </div>
    )},
  ]

  useEffect(() => {
    const handler = e => {
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i+1, slides.length-1))
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i-1, 0))
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6">
      <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">✕</button>
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-[10px] text-white/30">{idx+1} / {slides.length}</div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gold">{slides[idx].title}</h3>
          <div className="font-mono text-[10px] text-white/30">GIGF Intelligence</div>
        </div>
        <div className="min-h-[350px]">{slides[idx].content}</div>
        <div className="flex items-center justify-center gap-4 mt-6">
          <button onClick={()=>setIdx(i=>Math.max(i-1,0))} disabled={idx===0} className="px-5 py-2 bg-white/8 rounded-xl text-sm text-white/60 hover:text-white disabled:opacity-30 transition-colors">Prev</button>
          <div className="flex gap-1.5">
            {slides.map((_,i) => <button key={i} onClick={()=>setIdx(i)} className={`h-1.5 rounded-full transition-all ${i===idx?'w-5 bg-gold':'w-1.5 bg-white/20'}`}/>)}
          </div>
          <button onClick={()=>idx===slides.length-1?onClose():setIdx(i=>i+1)} className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${idx===slides.length-1?'bg-gold text-navy':'bg-white/8 text-white/60 hover:text-white'}`}>{idx===slides.length-1?'Close':'Next'}</button>
        </div>
        <p className="text-center text-white/20 text-[10px] mt-3">Use arrow keys to navigate</p>
      </div>
    </div>
  )
}
