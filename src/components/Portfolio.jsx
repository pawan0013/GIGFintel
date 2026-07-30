import { useState } from 'react'
import { claudeAPI, PORTFOLIO_SYSTEM } from '../api'

const PORTCOS = [
  { name: 'Chargepoly',  sector: 'Clean Mobility',      stage: 'Series B', board: 'Alexandre Derreumaux', co2: 'Heavy-duty EV charging infrastructure' },
  { name: 'iwell',       sector: 'Low-carbon Economy',  stage: 'Series B', board: 'Alexandre Derreumaux', co2: 'Smart battery storage + EMS' },
  { name: 'Oxand',       sector: 'Smart Cities',        stage: 'Growth',   board: 'Meridiam GIGF',        co2: 'Asset lifecycle management software' },
  { name: 'Exoès',       sector: 'Clean Mobility',      stage: 'Growth',   board: 'Meridiam GIGF',        co2: 'EV thermal management engineering' },
  { name: 'ESG Book',    sector: 'Low-carbon Data',     stage: 'Series B', board: 'Meridiam GIGF',        co2: 'ESG data infrastructure platform' },
]

const SECTOR_COLORS = {
  'Clean Mobility':     'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'Low-carbon Economy': 'bg-green-500/15 text-green-400 border-green-500/25',
  'Smart Cities':       'bg-purple-500/15 text-purple-400 border-purple-500/25',
  'Low-carbon Data':    'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  'Circular Economy':   'bg-amber-500/15 text-amber-400 border-amber-500/25',
}

export default function Portfolio({ apiKey, tvKey }) {
  const [selected, setSelected] = useState(null)
  const [signal, setSignal]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const getUpdate = async (company) => {
    if (!apiKey) { setError('No API key — go to Settings.'); return }
    setSelected(company.name); setLoading(true); setSignal(null); setError('')
    try {
      const raw = await claudeAPI(
        PORTFOLIO_SYSTEM,
        `Analyse ${company.name} (${company.sector}, ${company.stage}) for GIGF quarterly board prep. CO2 focus: ${company.co2}. What are the latest competitive threats, growth signals, and impact updates?`,
        apiKey
      )
      const clean = raw.replace(/```json|```/g, '').trim()
      const start = clean.indexOf('{'); const end = clean.lastIndexOf('}')
      if (start >= 0 && end >= 0) setSignal(JSON.parse(clean.slice(start, end+1)))
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-6">
        <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-gold">Portfolio Monitor</span>
        <h2 className="text-2xl font-bold text-white mt-1">Competitive Intelligence</h2>
        <p className="text-white/40 text-sm mt-1">Real-time signals across {PORTCOS.length} portfolio companies. Click any company for an update.</p>
      </div>

      <button onClick={() => PORTCOS.forEach((p, i) => setTimeout(() => getUpdate(p), i * 800))}
        className="w-full bg-gold text-navy rounded-xl py-3 font-bold text-sm mb-5 hover:bg-gold-2 transition-colors">
        Scan All Companies
      </button>

      <div className="bg-navy-2 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              {['COMPANY','SECTOR','STAGE','BOARD','LATEST SIGNAL','ACTION'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[9px] font-bold tracking-[0.12em] uppercase text-white/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PORTCOS.map((p, i) => (
              <tr key={p.name} className={`border-b border-white/5 last:border-0 ${selected === p.name ? 'bg-gold/5' : 'hover:bg-white/2'} transition-colors`}>
                <td className="px-4 py-3.5 text-white font-semibold text-sm">{p.name}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[9px] font-bold px-2 py-1 rounded border ${SECTOR_COLORS[p.sector] || 'bg-white/8 text-white/50 border-white/10'}`}>
                    {p.sector.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-white/50 text-xs">{p.stage}</td>
                <td className="px-4 py-3.5 text-white/40 text-xs">{p.board || '—'}</td>
                <td className="px-4 py-3.5 text-white/40 text-xs">
                  {selected === p.name && signal ? (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${signal.signal === 'Positive' ? 'bg-green-500/15 text-green-400' : signal.signal === 'Risk' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {signal.signal}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3.5">
                  <button onClick={() => getUpdate(p)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/6 text-white/50 hover:bg-gold/15 hover:text-gold border border-white/8 hover:border-gold/25 transition-all">
                    {loading && selected === p.name ? 'Scanning…' : 'Update'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signal detail panel */}
      {signal && selected && (
        <div className="mt-5 bg-navy-2 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">{selected} — Latest Intel</h3>
            <span className={`text-[9px] font-bold px-2 py-1 rounded ${signal.signal === 'Positive' ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'}`}>
              {signal.signal}
            </span>
          </div>
          {signal.headline_development && (
            <div className="mb-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/30 mb-1">Headline Development</p>
              <p className="text-sm text-white/70 leading-relaxed">{signal.headline_development}</p>
            </div>
          )}
          {signal.impact_update && (
            <div className="mb-3 bg-gold/8 border border-gold/20 rounded-lg p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gold mb-1">🌱 Impact Update</p>
              <p className="text-sm text-white/70">{signal.impact_update}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 mb-3">
            {signal.competitive_threats?.length > 0 && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-red-400 mb-2">Competitive Threats</p>
                {signal.competitive_threats.map((t,i) => <p key={i} className="text-xs text-white/55 mb-1">⚑ {t}</p>)}
              </div>
            )}
            {signal.growth_signals?.length > 0 && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-green-400 mb-2">Growth Signals</p>
                {signal.growth_signals.map((s,i) => <p key={i} className="text-xs text-white/55 mb-1">↑ {s}</p>)}
              </div>
            )}
          </div>
          {signal.recommended_action && (
            <div className="bg-gold/8 border border-gold/20 rounded-lg p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gold mb-1">Recommended Action</p>
              <p className="text-sm text-white/70">{signal.recommended_action}</p>
            </div>
          )}
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
      )}
    </div>
  )
}
