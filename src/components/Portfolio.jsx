import { useState } from 'react'
import { claudeAPI, parseJSON, tavily, PORTFOLIO_SYSTEM, PORTFOLIO } from '../api'
import { Card, Label, Badge, Button, Empty } from './UI'

export default function Portfolio({ apiKey, tvKey }) {
  const [signals, setSignals] = useState({})
  const [loading, setLoading] = useState(null)

  const getSignal = async (company) => {
    setLoading(company.name)
    try {
      let ctx = `${company.name} (${company.desc}), ${company.sector}, ${company.stage}`
      const td = await tavily(`${company.name} news competitor funding 2025 2026`, tvKey)
      if (td?.results) ctx += '\\n' + td.results.map(r => r.title + ': ' + (r.content||'')).slice(0,3).join('\\n')
      const raw = await claudeAPI(PORTFOLIO_SYSTEM, ctx, apiKey)
      const s = parseJSON(raw)
      setSignals(prev => ({...prev, [company.name]: s}))
    } catch(e) { setSignals(prev => ({...prev, [company.name]: {error: e.message}})) }
    setLoading(null)
  }

  const scanAll = async () => {
    for (const c of PORTFOLIO) {
      await getSignal(c)
    }
  }

  const sigColor = s => s === 'Positive' ? 'text-green-400' : s === 'Concern' ? 'text-red-400' : 'text-amber-400'

  return (
    <div>
      <div className="mb-5">
        <Label>Portfolio Monitor</Label>
        <h2 className="text-xl font-bold text-white mt-1">Competitive Intelligence</h2>
        <p className="text-white/40 text-sm mt-0.5">Real-time signals across 8 portfolio companies. Click any company for an update.</p>
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={scanAll} className="flex-none">Scan All Companies</Button>
      </div>

      {/* PORTFOLIO TABLE */}
      <Card className="mb-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10">
              {['Company','Sector','Stage','Board','Latest Signal','Action'].map(h => <th key={h} className="text-left py-2.5 px-3 text-[9px] font-bold tracking-[0.1em] uppercase text-white/30">{h}</th>)}
            </tr></thead>
            <tbody>
              {PORTFOLIO.map(c => {
                const sig = signals[c.name]
                return (
                  <tr key={c.name} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">{c.name}</td>
                    <td className="py-3 px-3"><Badge>{c.sector}</Badge></td>
                    <td className="py-3 px-3 font-mono text-[10px] text-white/50">{c.stage}</td>
                    <td className="py-3 px-3 text-xs text-gold/70">{c.board || '—'}</td>
                    <td className="py-3 px-3">
                      {loading === c.name ? <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"/> :
                       sig?.error ? <span className="text-red-400 text-xs">Error</span> :
                       sig ? <span className={`text-xs font-medium ${sigColor(sig.signal)}`}>{sig.signal} — {sig.headline_development?.slice(0,50)}...</span> :
                       <span className="text-white/20 text-xs">—</span>}
                    </td>
                    <td className="py-3 px-3">
                      <button onClick={()=>getSignal(c)} disabled={loading===c.name}
                        className="text-[10px] px-2.5 py-1 bg-white/5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30">
                        {loading===c.name ? '...' : 'Update'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SIGNAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PORTFOLIO.filter(c => signals[c.name] && !signals[c.name].error).map(c => {
          const sig = signals[c.name]
          return (
            <Card key={c.name} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-white text-sm">{c.name}</p>
                  <p className="text-[10px] text-white/30">{c.sector} · {c.stage}</p>
                </div>
                <Badge>{sig.signal}</Badge>
              </div>
              <p className="text-xs font-medium text-white/70 mb-1">{sig.headline_development}</p>
              {sig.competitive_threats?.filter(Boolean).length > 0 && (
                <div className="mt-1.5">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Threats</p>
                  <p className="text-xs text-red-400/70">{sig.competitive_threats.join(' · ')}</p>
                </div>
              )}
              {sig.growth_signals?.filter(Boolean).length > 0 && (
                <div className="mt-1.5">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Growth Signals</p>
                  <p className="text-xs text-green-400/70">{sig.growth_signals.join(' · ')}</p>
                </div>
              )}
              {sig.recommended_action && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <p className="text-[9px] text-gold uppercase tracking-wider mb-0.5">Recommended Action</p>
                  <p className="text-xs text-white/60">{sig.recommended_action}</p>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
