import { useState } from 'react'
import { updateDealStatus } from '../firebase'
import { Card, Label, Badge, Empty } from './UI'

const STATUSES = ['Screening','First Call','Deep Dive','IC Review','Term Sheet','Invested','Passed','Watching']

const statusColor = s => ({
  'Invested':  'bg-green-500/15 text-green-400 border-green-500/25',
  'Passed':    'bg-red-500/15 text-red-400 border-red-500/25',
  'IC Review': 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'Deep Dive': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  'Term Sheet':'bg-purple-500/15 text-purple-400 border-purple-500/25',
}[s] || 'bg-white/8 text-white/50 border-white/15')

const scoreColor = s => s >= 70 ? 'text-green-400' : s >= 45 ? 'text-amber-400' : 'text-red-400'

export default function Tracker({ user, deals = [], refreshDeals }) {
  const [filter,  setFilter]  = useState('all')
  const [editing, setEditing] = useState(null)

  const safeDeals = Array.isArray(deals) ? deals : []

  const filtered = filter === 'all' ? safeDeals : safeDeals.filter(d => (d.humanStatus || 'Screening') === filter)

  // ── BeatRate data ──
  const screened   = safeDeals.length
  const withDecision = safeDeals.filter(d => d.humanDecision)
  const agreements   = withDecision.filter(d => d.humanDecision === d.rec)
  const matchRate    = withDecision.length > 0 ? Math.round((agreements.length / withDecision.length) * 100) : null
  const divergences  = withDecision.filter(d => d.humanDecision !== d.rec)
  const invested     = safeDeals.filter(d => d.humanStatus === 'Invested').length
  const passed       = safeDeals.filter(d => d.humanStatus === 'Passed').length

  const exportCSV = () => {
    if (!safeDeals.length) return
    const h = ['Company','Sector','Stage','AI Score','AI Rec','Human Decision','Status','Notes','Divergence','Date']
    const rows = safeDeals.map(d => [
      d.company, d.sector, d.stage, d.score, d.rec,
      d.humanDecision||'—', d.humanStatus||'Screening',
      d.notes||'', d.divergence ? 'YES' : 'NO',
      new Date(d.createdAt).toLocaleDateString('en-GB')
    ])
    const csv = [h,...rows].map(r => r.map(c => '"' + String(c||'').replace(/"/g,'""') + '"').join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'GIGF_Pipeline_' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
  }

  const handleStatusUpdate = async (deal, status) => {
    if (deal.docId) await updateDealStatus(deal.docId, status, deal.notes || '')
    await refreshDeals?.()
  }

  const handleNotesUpdate = async (deal, notes) => {
    if (deal.docId) await updateDealStatus(deal.docId, deal.humanStatus || 'Screening', notes)
    await refreshDeals?.()
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label>Deal Tracker</Label>
          <h2 className="text-2xl font-bold text-white mt-2">Pipeline Management</h2>
          <p className="text-white/40 text-sm mt-1">AI recommendation vs human decision logged side by side. Divergences train the model.</p>
        </div>
        <button onClick={exportCSV}
          className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/12 hover:text-white transition-colors">
          Export CSV
        </button>
      </div>

      {/* ── BeatRate Dashboard ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Screened', value: screened, sub: 'all time', color: 'text-white' },
          { label: 'AI Match Rate', value: matchRate !== null ? `${matchRate}%` : '—', sub: `${withDecision.length} decisions logged`, color: matchRate >= 70 ? 'text-green-400' : matchRate >= 50 ? 'text-amber-400' : 'text-red-400' },
          { label: 'Invested', value: invested, sub: 'converted', color: 'text-green-400' },
          { label: 'Divergences', value: divergences.length, sub: 'AI vs human split', color: 'text-amber-400' },
        ].map(({ label, value, sub, color }) => (
          <Card key={label} className="p-4">
            <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-1">{label}</p>
            <p className={`font-mono text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-white/30 text-xs mt-0.5">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter==='all'?'bg-gold/20 text-gold border border-gold/30':'bg-white/5 text-white/40 hover:text-white/70'}`}>
          All ({safeDeals.length})
        </button>
        {STATUSES.map(s => {
          const count = safeDeals.filter(d => (d.humanStatus||'Screening') === s).length
          if (count === 0) return null
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter===s?'bg-gold/20 text-gold border border-gold/30':'bg-white/5 text-white/40 hover:text-white/70'}`}>
              {s} ({count})
            </button>
          )
        })}
      </div>

      {/* Pipeline table */}
      {filtered.length === 0
        ? <Empty title="No deals in pipeline" subtitle="Screen a company, make a decision on the Decision tab, and it will appear here." icon="📊"/>
        : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Company','Sector','AI Score','AI Rec','Human','Divergence','Status','Notes','Date'].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-[9px] font-bold tracking-[0.1em] uppercase text-white/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-white text-sm">{d.company}</p>
                        {d.divergence && (
                          <span className="text-[8px] font-bold uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">Divergence</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-white/45">{d.sector||'—'}</td>
                      <td className="py-3 px-3">
                        <span className={`font-mono font-bold text-sm ${scoreColor(d.score||0)}`}>{d.score||'?'}</span>
                      </td>
                      <td className="py-3 px-3"><Badge>{d.rec}</Badge></td>
                      <td className="py-3 px-3">
                        {d.humanDecision
                          ? <Badge>{d.humanDecision}</Badge>
                          : <span className="text-white/20 text-xs">—</span>
                        }
                      </td>
                      <td className="py-3 px-3 max-w-[140px]">
                        {d.divergence
                          ? <span className="text-[9px] font-semibold text-amber-400/80 leading-tight block">
                              {d.divergenceCategory || 'Unclassified'}
                            </span>
                          : <span className="text-white/15 text-xs">—</span>
                        }
                      </td>
                      <td className="py-3 px-3">
                        <select value={d.humanStatus||'Screening'} onChange={e => handleStatusUpdate(d, e.target.value)}
                          className={`text-[10px] px-2 py-1 rounded-lg font-bold cursor-pointer border focus:outline-none bg-transparent ${statusColor(d.humanStatus||'Screening')}`}
                          style={{ background: 'transparent' }}>
                          {STATUSES.map(s => <option key={s} value={s} style={{ background: '#0e1c3a' }}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-3 px-3 max-w-[180px]">
                        {editing === i
                          ? <input defaultValue={d.notes||''} autoFocus
                              onBlur={e => handleNotesUpdate(d, e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleNotesUpdate(d, e.target.value)}
                              className="w-full bg-navy-3 border border-gold/40 rounded px-2 py-1 text-xs text-white focus:outline-none"/>
                          : <span onClick={() => setEditing(i)} className="text-xs text-white/35 hover:text-white/60 cursor-text truncate block">
                              {d.notes || 'Add note…'}
                            </span>
                        }
                      </td>
                      <td className="py-3 px-3 text-[10px] text-white/25">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-GB') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      }

      {/* Divergence log */}
      {divergences.length > 0 && (
        <div>
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-3">Divergence Log — Learning Opportunities</p>
          <div className="space-y-2">
            {divergences.map((d, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-white text-sm">{d.company}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/30">AI said</span>
                    <Badge>{d.rec}</Badge>
                    <span className="text-white/20 text-xs">→</span>
                    <span className="text-[9px] text-white/30">You said</span>
                    <Badge>{d.humanDecision}</Badge>
                  </div>
                  <span className={`font-mono text-xs font-bold ${scoreColor(d.score||0)} ml-auto`}>{d.score}/100</span>
                </div>
                {d.divergenceCategory && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-amber-400/60">Category:</span>
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">{d.divergenceCategory}</span>
                    {d.divergenceCategory === 'Valuation too high' && (
                      <span className="text-[8px] text-white/25 italic">excluded from model training</span>
                    )}
                  </div>
                )}
                {!d.divergenceCategory && (
                  <div className="mt-1.5">
                    <span className="text-[8px] text-amber-400/40 italic">Category not classified — add one to improve training signal</span>
                  </div>
                )}
                {d.gdprConsent && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[8px] font-bold text-blue-400/60">✓ Training consent obtained — included in DPO pipeline</span>
                  </div>
                )}
                {d.notes && <p className="text-white/40 text-xs mt-1.5 leading-relaxed">{d.notes}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
