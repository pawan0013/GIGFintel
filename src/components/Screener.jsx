import { useState, useCallback, useEffect } from 'react'
import { claudeAPI, parseJSON, tavily, MEMO_SYSTEM, enrichCompany, PORTFOLIO_NAMES, PORTFOLIO } from '../api'
import { saveDeal, getSimilarDeals } from '../firebase'

const G = '#4a9e6b'
const GD = 'rgba(74,158,107,'

// ─── Mandatory Criteria Checker ───────────────────────────────────────────────
function CriteriaChecker({ criteria }) {
  if (!criteria) return null
  const items = [
    { key: 'fast_growing',    label: 'Fast-growing SME',        desc: '>15% growth, intl potential' },
    { key: 'strong_model',    label: 'Strong Business Model',   desc: 'Validated, path to profit' },
    { key: 'solid_team',      label: 'Solid Management Team',   desc: 'Equity committed, entrepreneurial' },
    { key: 'ecological_impact', label: 'Ecological Transition', desc: 'Impact is the business model' },
  ]
  const allPass = items.every(i => criteria[i.key]?.pass)
  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: allPass ? `${GD}0.06)` : 'rgba(239,68,68,0.06)', border: `1px solid ${allPass ? `${GD}0.2)` : 'rgba(239,68,68,0.2)'}` }}>
      <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-3" style={{ color: allPass ? G : '#ef4444' }}>
        {allPass ? '✓ All 4 Mandatory Criteria Pass' : '⚑ Mandatory Criteria — Review Required'}
      </p>
      <div className="space-y-2">
        {items.map(({ key, label, desc }) => {
          const c = criteria[key] || {}
          return (
            <div key={key} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                className={c.pass ? 'bg-gold/15 border border-gold/40' : 'bg-red-500/15 border border-red-500/40'}>
                <span className="text-[8px]" style={{ color: c.pass ? G : '#ef4444' }}>{c.pass ? '✓' : '✗'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: c.pass ? 'rgba(232,245,238,0.8)' : 'rgba(239,68,68,0.8)' }}>{label}</p>
                {c.note && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(232,245,238,0.4)' }}>{c.note}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Impact Score Panel ───────────────────────────────────────────────────────
function ImpactPanel({ impact }) {
  if (!impact) return null
  return (
    <div className="rounded-xl p-4" style={{ background: `${GD}0.06)`, border: `1px solid ${GD}0.2)` }}>
      <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-3" style={{ color: G }}>🌱 Impact Assessment</p>
      <div className="space-y-2">
        {impact.co2_avoided && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(232,245,238,0.35)' }}>CO₂ Avoided</p>
            <p className="text-sm font-bold" style={{ color: G }}>{impact.co2_avoided}</p>
          </div>
        )}
        {impact.sdg_alignment?.length > 0 && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(232,245,238,0.35)' }}>SDG Alignment</p>
            <div className="flex flex-wrap gap-1">
              {impact.sdg_alignment.map((sdg, i) => (
                <span key={i} className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: `${GD}0.15)`, color: G, border: `1px solid ${GD}0.25)` }}>{sdg}</span>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: impact.article9_compliant ? G : '#ef4444' }}/>
            <span className="text-[10px]" style={{ color: 'rgba(232,245,238,0.5)' }}>Article 9 SFDR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: impact.greenfin_eligible ? G : '#ef4444' }}/>
            <span className="text-[10px]" style={{ color: 'rgba(232,245,238,0.5)' }}>GREENFIN</span>
          </div>
        </div>
        {impact.impact_note && <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(232,245,238,0.45)' }}>{impact.impact_note}</p>}
      </div>
    </div>
  )
}

// ─── Scoring Breakdown ────────────────────────────────────────────────────────
function ScoringBreakdown({ breakdown }) {
  if (!breakdown) return null
  const dims = [
    { key: 'growth_momentum', label: 'Growth Momentum', icon: '📈' },
    { key: 'impact_integrity', label: 'Impact Integrity', icon: '🌿' },
    { key: 'team_commitment',  label: 'Team Commitment',  icon: '👥' },
    { key: 'business_model',   label: 'Business Model',   icon: '💼' },
  ]
  return (
    <div className="space-y-2.5">
      {dims.map(({ key, label, icon }) => {
        const b = breakdown[key] || { score: 0, max: 25, note: '' }
        const pct = (b.score / b.max) * 100
        const col = pct >= 72 ? G : pct >= 48 ? '#f59e0b' : '#ef4444'
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{icon}</span>
              <span className="text-xs font-semibold flex-1" style={{ color: 'rgba(232,245,238,0.7)' }}>{label}</span>
              <span className="font-mono text-sm font-bold" style={{ color: col }}>{b.score}<span className="text-[10px] font-normal" style={{ color: 'rgba(232,245,238,0.25)' }}>/{b.max}</span></span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(232,245,238,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: col }}/>
            </div>
            {b.note && <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'rgba(232,245,238,0.35)' }}>{b.note}</p>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function TabOverview({ m }) {
  const score = m.thesis_fit_score
  const col = score >= 70 ? G : score >= 45 ? '#f59e0b' : '#ef4444'
  const recBg = m.recommendation === 'INVEST' ? `${GD}0.15)` : m.recommendation === 'PASS' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'
  const recBorder = m.recommendation === 'INVEST' ? `${GD}0.3)` : m.recommendation === 'PASS' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'
  const recCol = m.recommendation === 'INVEST' ? G : m.recommendation === 'PASS' ? '#ef4444' : '#f59e0b'
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{m.company}</h3>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(232,245,238,0.4)' }}>{m.tagline}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide" style={{ background: recBg, color: recCol, border: `1px solid ${recBorder}` }}>{m.recommendation}</span>
            {[m.sector, m.stage, m.geography].filter(Boolean).map(t => (
              <span key={t} className="text-[9px] px-2 py-1 rounded-full" style={{ background: 'rgba(232,245,238,0.06)', color: 'rgba(232,245,238,0.5)', border: '1px solid rgba(232,245,238,0.1)' }}>{t}</span>
            ))}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(232,245,238,0.3)' }}>GIGF Fit</p>
          <p className="font-mono font-bold text-4xl" style={{ color: col }}>{score}<span className="text-sm font-normal" style={{ color: 'rgba(232,245,238,0.25)' }}>/100</span></p>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(232,245,238,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: col }}/>
      </div>

      <CriteriaChecker criteria={m.mandatory_criteria}/>

      <div className="rounded-xl p-4" style={{ background: 'rgba(232,245,238,0.03)', border: '1px solid rgba(232,245,238,0.08)' }}>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-3" style={{ color: G }}>Scoring Breakdown</p>
        <ScoringBreakdown breakdown={m.scoring_breakdown}/>
      </div>

      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(232,245,238,0.3)' }}>Executive Summary</p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,245,238,0.65)' }}>{m.executive_summary}</p>
      </div>
      <div className="rounded-xl p-3.5" style={{ background: `${GD}0.08)`, border: `1px solid ${GD}0.2)` }}>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1.5" style={{ color: G }}>Recommendation</p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,245,238,0.7)' }}>{m.recommendation_rationale}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {['tam','sam','som'].map(k => (
          <div key={k} className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(232,245,238,0.04)' }}>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(232,245,238,0.3)' }}>{k.toUpperCase()}</p>
            <p className="text-sm font-bold text-white mt-0.5">{m.market?.[k]||'—'}</p>
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: 'rgba(232,245,238,0.5)' }}><span className="font-medium text-white">Tailwind: </span>{m.market?.key_tailwind}</p>

      <ImpactPanel impact={m.impact}/>
    </div>
  )
}

// ─── Tab: Deep Dive ───────────────────────────────────────────────────────────
function TabDeepDive({ m }) {
  return (
    <div className="space-y-4">
      {[['Product & Moat', [['What it does', m.product?.what_it_does], ['Competitive moat', m.product?.moat], ['vs Competitors', m.product?.vs_competitors]]]].map(([title, items]) => (
        <div key={title}>
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(232,245,238,0.3)' }}>{title}</p>
          <div className="space-y-2">
            {items.filter(([,v]) => v).map(([k,v]) => (
              <div key={k} className="rounded-xl p-3" style={{ background: 'rgba(232,245,238,0.03)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(232,245,238,0.3)' }}>{k}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,245,238,0.65)' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(232,245,238,0.3)' }}>Team</p>
        <div className="rounded-xl p-3" style={{ background: 'rgba(232,245,238,0.03)' }}>
          <div className="flex gap-2 mb-2">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${GD}0.15)`, color: G }}>{m.team?.founder_market_fit} Fit</span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,245,238,0.08)', color: 'rgba(232,245,238,0.6)' }}>Equity: {m.team?.equity_commitment}</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,245,238,0.65)' }}>{m.team?.assessment}</p>
          {m.team?.key_gaps && <p className="text-xs mt-1.5" style={{ color: 'rgba(232,245,238,0.35)' }}>Gaps: {m.team.key_gaps}</p>}
        </div>
      </div>

      {m.return_scenarios && (m.return_scenarios.base || m.return_scenarios.bull) && (
        <div>
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(232,245,238,0.3)' }}>Return Scenarios</p>
          <div className="grid grid-cols-3 gap-2">
            {[['Base', m.return_scenarios.base, '#f59e0b'], ['Bull', m.return_scenarios.bull, G], ['Bear', m.return_scenarios.bear, '#ef4444']].map(([label, val, col]) => (
              <div key={label} className="rounded-lg p-2.5" style={{ background: 'rgba(232,245,238,0.03)' }}>
                <p className="text-[9px] font-bold uppercase mb-1" style={{ color: col }}>{label}</p>
                <p className="text-xs" style={{ color: 'rgba(232,245,238,0.6)' }}>{val || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(232,245,238,0.3)' }}>Risk Register</p>
        <div className="space-y-2">
          {(m.risks||[]).map((r,i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl p-3" style={{ background: 'rgba(232,245,238,0.03)' }}>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: r.severity==='High'?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.15)', color: r.severity==='High'?'#ef4444':'#f59e0b' }}>{r.severity}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'rgba(232,245,238,0.75)' }}>{r.description}</p>
                {r.mitigant && <p className="text-xs mt-0.5" style={{ color: 'rgba(232,245,238,0.35)' }}>Mitigant: {r.mitigant}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(232,245,238,0.3)' }}>Comparables</p>
        {(m.comparables||[]).map((c,i) => (
          <div key={i} className="flex gap-3 py-2 text-sm" style={{ borderBottom: '1px solid rgba(232,245,238,0.05)' }}>
            <span className="font-semibold text-white">{c.company}</span>
            <span style={{ color: 'rgba(232,245,238,0.3)' }}>{c.round}</span>
            <span className="flex-1" style={{ color: 'rgba(232,245,238,0.5)' }}>{c.relevance}</span>
          </div>
        ))}
      </div>

      {m.diligence_questions?.length > 0 && (
        <div>
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(232,245,238,0.3)' }}>Diligence Questions</p>
          {m.diligence_questions.map((q,i) => (
            <div key={i} className="flex gap-2.5 py-1.5 text-sm" style={{ borderBottom: '1px solid rgba(232,245,238,0.05)' }}>
              <span className="font-mono font-bold flex-shrink-0" style={{ color: 'rgba(232,245,238,0.25)' }}>Q{i+1}</span>
              <span style={{ color: 'rgba(232,245,238,0.6)' }}>{q}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: IC Prep ─────────────────────────────────────────────────────────────
function TabICPrep({ m }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: '#ef4444' }}>Red Flags</p>
        {(m.red_flags||[]).length === 0
          ? <p className="text-sm" style={{ color: 'rgba(232,245,238,0.3)' }}>No critical red flags identified.</p>
          : (m.red_flags||[]).map((f,i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-xl p-3 mb-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-red-400 text-base flex-shrink-0">⚑</span>
              <p className="text-sm" style={{ color: 'rgba(239,68,68,0.9)' }}>{f}</p>
            </div>
          ))
        }
      </div>

      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-3" style={{ color: G }}>Partner Questions — IC</p>
        {(m.partner_questions||[]).map((q,i) => (
          <div key={i} className="flex gap-3 rounded-xl p-3.5 mb-2" style={{ background: 'rgba(232,245,238,0.03)', border: '1px solid rgba(232,245,238,0.08)' }}>
            <span className="font-mono font-bold text-sm flex-shrink-0" style={{ color: G }}>Q{i+1}</span>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,245,238,0.7)' }}>{q}</p>
          </div>
        ))}
      </div>

      {m.portfolio_adjacency && (
        <div>
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(232,245,238,0.3)' }}>Portfolio Adjacency</p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,245,238,0.6)' }}>{m.portfolio_adjacency}</p>
        </div>
      )}

      {/* AI Transparency Appendix — Alexandre's requirement */}
      <div className="rounded-xl p-4 mt-2" style={{ background: 'rgba(127,184,200,0.06)', border: '1px solid rgba(127,184,200,0.2)' }}>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: '#7fb8c8' }}>🤖 AI Analysis Appendix</p>
        <p className="text-xs leading-relaxed mb-2" style={{ color: 'rgba(232,245,238,0.5)' }}>
          <strong style={{ color: 'rgba(232,245,238,0.7)' }}>AI-generated:</strong> Market research (Tavily web search), financial data extraction, competitor mapping, scoring against GIGF thesis, comparable transactions, diligence question generation, risk identification.
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(232,245,238,0.5)' }}>
          <strong style={{ color: 'rgba(232,245,238,0.7)' }}>Human judgment required:</strong> Founder reference calls, management team direct assessment, final IC recommendation, valuation negotiation, board seat strategy, impact measurement methodology validation, Article 9 compliance sign-off.
        </p>
        {m.ai_analysis_note && <p className="text-xs mt-2 leading-relaxed" style={{ color: 'rgba(127,184,200,0.7)' }}>{m.ai_analysis_note}</p>}
      </div>
    </div>
  )
}

// ─── Tab: Decision ────────────────────────────────────────────────────────────
function TabDecision({ m, user, saved, setSaved, refreshDeals, onSaveToTracker }) {
  const [decision, setDecision] = useState('')
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [divergenceCat, setDivergenceCat] = useState('')
  const [gdprConsent, setGdprConsent]     = useState(false)

  const decisions = [
    { label: 'INVEST', style: { border: '1px solid rgba(74,158,107,0.5)', color: '#4a9e6b', background: 'rgba(74,158,107,0.1)' }, activeStyle: { border: '1px solid #4a9e6b', background: 'rgba(74,158,107,0.2)' } },
    { label: 'WATCH',  style: { border: '1px solid rgba(245,158,11,0.5)', color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }, activeStyle: { border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.2)' } },
    { label: 'PASS',   style: { border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444', background: 'rgba(239,68,68,0.1)' },  activeStyle: { border: '1px solid #ef4444', background: 'rgba(239,68,68,0.2)' } },
  ]

  const handleSave = async () => {
    setSaving(true)
    try { await onSaveToTracker(decision, notes, decision === m.recommendation, divergenceCat, gdprConsent); setSaved(true) }
    catch(e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-4" style={{ background: 'rgba(232,245,238,0.03)', border: '1px solid rgba(232,245,238,0.08)' }}>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(232,245,238,0.3)' }}>AI Recommendation</p>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ background: `${GD}0.15)`, color: G }}>{m.recommendation}</span>
          <span className="font-mono font-bold" style={{ color: G }}>{m.thesis_fit_score}/100</span>
        </div>
        <p className="text-xs mt-2 leading-relaxed" style={{ color: 'rgba(232,245,238,0.5)' }}>{m.recommendation_rationale}</p>
      </div>

      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-3" style={{ color: G }}>Your Decision</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {decisions.map(({ label, style, activeStyle }) => (
            <button key={label} onClick={() => setDecision(label)}
              className="py-3 rounded-xl font-bold text-sm transition-all duration-200"
              style={decision === label ? activeStyle : style}>
              {label}
            </button>
          ))}
        </div>
        {decision && decision !== m.recommendation && (
          <div className="rounded-lg px-3 py-2 mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-xs" style={{ color: '#f59e0b' }}>⚡ Divergence logged — this trains the GIGF scoring model.</p>
          </div>
        )}
      </div>

      {decision && decision !== m.recommendation && (
        <div>
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: '#f59e0b' }}>Divergence Category</p>
          <select value={divergenceCat} onChange={e => setDivergenceCat(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
            style={{ background: 'rgba(15,45,23,0.8)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <option value="">Select reason…</option>
            <option value="Impact not core">Impact not core to business model</option>
            <option value="Growth below hurdle">Revenue growth below 15% hurdle</option>
            <option value="Team concern">Team equity commitment or depth concern</option>
            <option value="Profitability timeline">Path to profitability beyond 24 months</option>
            <option value="Geography">Outside European mandate</option>
            <option value="Stage mismatch">Stage mismatch for GIGF mandate</option>
          </select>
        </div>
      )}

      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(232,245,238,0.3)' }}>Analyst Notes</p>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Add reasoning, conditions, or impact assessment notes…"
          className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-white/20 resize-none"
          style={{ background: 'rgba(15,45,23,0.8)', border: '1px solid rgba(232,245,238,0.1)' }}/>
      </div>

      <div className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'rgba(127,184,200,0.06)', border: '1px solid rgba(127,184,200,0.15)' }}>
        <input type="checkbox" id="gdpr" checked={gdprConsent} onChange={e => setGdprConsent(e.target.checked)} className="mt-0.5 flex-shrink-0 cursor-pointer"/>
        <label htmlFor="gdpr" className="cursor-pointer">
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#7fb8c8' }}>Include in GIGF training dataset</p>
          <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'rgba(127,184,200,0.6)' }}>Founder consent obtained. Seeds DPO fine-tuning pipeline.</p>
        </label>
      </div>

      <button onClick={handleSave} disabled={!decision || saving || saved}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200"
        style={saved
          ? { background: `${GD}0.15)`, color: G, border: `1px solid ${GD}0.25)` }
          : !decision ? { background: 'rgba(232,245,238,0.05)', color: 'rgba(232,245,238,0.25)', cursor: 'not-allowed' }
          : { background: G, color: '#0a1f0f' }}>
        {saving ? 'Saving…' : saved ? '✓ Logged to Tracker' : 'Log Decision & Save to Pipeline'}
      </button>
    </div>
  )
}

// ─── Tab: Export ──────────────────────────────────────────────────────────────
function exportPDF(m) {
  const col = m.thesis_fit_score >= 70 ? '#2d7a47' : m.thesis_fit_score >= 45 ? '#92400e' : '#991b1b'
  const w = window.open('', '_blank')
  w.document.write(`<!DOCTYPE html><html><head><title>${m.company} — GIGF IC Memo</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 820px; margin: 0 auto; padding: 2.5rem; font-size: 12px; line-height: 1.65; color: #1a1a1a; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-35deg); font-size: 52px; font-weight: 900; color: rgba(10,31,15,0.04); white-space: nowrap; pointer-events: none; }
    .header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #0a1f0f; }
    h1 { font-size: 26px; font-weight: 800; color: #0a1f0f; margin: 0 0 .25rem; }
    h2 { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #666; margin: 1.2rem 0 .5rem; border-bottom: 1px solid #e5e5e5; padding-bottom: .2rem; }
    .score { font-size: 36px; font-weight: 800; color: ${col}; font-family: monospace; }
    .rec { display: inline-block; padding: .2rem .6rem; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; background: ${m.recommendation === 'INVEST' ? '#dcfce7' : '#fee2e2'}; color: ${m.recommendation === 'INVEST' ? '#166534' : '#991b1b'}; }
    .impact-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: .8rem; margin: .5rem 0; }
    .criteria-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; margin: .5rem 0; }
    .criterion { padding: .4rem .6rem; border-radius: 6px; font-size: 10px; font-weight: 600; }
    .pass { background: #dcfce7; color: #166534; }
    .fail { background: #fee2e2; color: #991b1b; }
    .ai-appendix { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: .8rem; margin-top: 1rem; }
    @media print { button { display: none } }
  </style></head><body>`)
  w.document.write('<div class="watermark">MERIDIAM GIGF</div>')
  w.document.write(`
    <div class="header">
      <div>
        <div style="font-size:8px;font-weight:700;color:#4a9e6b;letter-spacing:.15em;text-transform:uppercase;margin-bottom:.4rem">🌱 GIGF Intelligence · IC Investment Memo · Article 9 SFDR</div>
        <h1>${m.company}</h1>
        <p style="color:#555;margin:.2rem 0">${m.tagline||''}</p>
        <div style="display:flex;gap:.4rem;margin-top:.4rem;align-items:center">
          <span class="rec">${m.recommendation}</span>
          <span style="font-size:10px;color:#555">${m.sector||''} · ${m.stage||''} · ${m.geography||''}</span>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:9px;color:#888;text-transform:uppercase">GIGF Fit</div>
        <div class="score">${m.thesis_fit_score}/100</div>
      </div>
    </div>

    <h2>Mandatory Criteria Check</h2>
    <div class="criteria-grid">
      ${Object.entries(m.mandatory_criteria||{}).map(([k,v]) => `<div class="criterion ${v.pass?'pass':'fail'}">${v.pass?'✓':'✗'} ${k.replace(/_/g,' ')}: ${v.note||''}</div>`).join('')}
    </div>

    <h2>Executive Summary</h2>
    <p>${m.executive_summary||''}</p>
    <p><strong>Recommendation:</strong> ${m.recommendation_rationale||''}</p>

    <h2>Impact Assessment</h2>
    <div class="impact-box">
      <p><strong>CO₂ Avoided:</strong> ${m.impact?.co2_avoided||'—'}</p>
      <p><strong>SDG Alignment:</strong> ${(m.impact?.sdg_alignment||[]).join(', ')||'—'}</p>
      <p><strong>Article 9 SFDR:</strong> ${m.impact?.article9_compliant?'✓ Compliant':'✗ Review needed'} | <strong>GREENFIN:</strong> ${m.impact?.greenfin_eligible?'✓ Eligible':'✗ Review needed'}</p>
      <p>${m.impact?.impact_note||''}</p>
    </div>

    <h2>Scoring Breakdown</h2>
    ${['growth_momentum','impact_integrity','team_commitment','business_model'].map(k => {
      const b = m.scoring_breakdown?.[k] || {score:0,max:25,note:''}
      return `<p><strong>${k.replace(/_/g,' ')}:</strong> ${b.score}/${b.max} — ${b.note||''}</p>`
    }).join('')}

    <h2>Market</h2>
    <p>TAM: ${m.market?.tam||'—'} | SAM: ${m.market?.sam||'—'} | SOM: ${m.market?.som||'—'}</p>
    <p><strong>Tailwind:</strong> ${m.market?.key_tailwind||''}</p>

    <h2>IC Questions</h2>
    ${(m.partner_questions||[]).map((q,i) => `<p><strong>Q${i+1}:</strong> ${q}</p>`).join('')}

    <div class="ai-appendix">
      <h2 style="border:none;margin-top:0">🤖 AI Analysis Appendix</h2>
      <p><strong>AI-generated:</strong> Market research, financial extraction, competitor mapping, scoring, comparables, diligence questions, risk identification.</p>
      <p><strong>Human judgment required:</strong> Founder reference calls, direct management assessment, final IC recommendation, valuation, board strategy, Article 9 compliance sign-off.</p>
      ${m.ai_analysis_note ? `<p>${m.ai_analysis_note}</p>` : ''}
    </div>

    <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e5e5e5;font-size:9px;color:#999;display:flex;justify-content:space-between">
      <span>🌱 GIGF Intelligence v1.0 · AI-assisted, human-reviewed · CONFIDENTIAL</span>
      <span>${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</span>
    </div>
    <script>window.onload=()=>window.print()<\/script>
  </body></html>`)
  w.document.close()
}

function TabExport({ m }) {
  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: 'rgba(232,245,238,0.4)' }}>Export this IC memo with the AI Analysis Appendix for submission.</p>
      <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: 'rgba(232,245,238,0.03)', border: '1px solid rgba(232,245,238,0.08)' }}>
        <span className="text-2xl flex-shrink-0">📄</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">PDF — Full IC Memo</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(232,245,238,0.4)' }}>Includes mandatory criteria check, impact assessment, AI appendix. Opens in new tab → Print → Save as PDF.</p>
        </div>
        <button onClick={() => exportPDF(m)}
          className="flex-shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
          className="bg-gold text-navy">
          Export PDF
        </button>
      </div>
    </div>
  )
}

// ─── Memo Output ──────────────────────────────────────────────────────────────
function MemoOutput({ memo, user, saved, setSaved, refreshDeals, onSaveToTracker }) {
  const [activeTab, setActiveTab] = useState('overview')
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'deepdive', label: 'Deep Dive' },
    { id: 'icprep',   label: 'IC Prep' },
    { id: 'decision', label: 'Decision' },
    { id: 'export',   label: 'Export' },
  ]
  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-0.5 rounded-xl p-1 mb-4 flex-shrink-0" style={{ background: 'rgba(15,45,23,0.8)', border: '1px solid rgba(74,158,107,0.15)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
            className={activeTab === t.id ? 'bg-gold text-navy' : 'text-white/40 hover:text-white/70'}>
            {t.label}
            {t.id === 'icprep' && (memo.red_flags||[]).length > 0 && (
              <span className="ml-1 text-[8px] text-white rounded-full px-1" style={{ background: '#ef4444' }}>{memo.red_flags.length}</span>
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === 'overview' && <TabOverview m={memo}/>}
        {activeTab === 'deepdive' && <TabDeepDive m={memo}/>}
        {activeTab === 'icprep'   && <TabICPrep   m={memo}/>}
        {activeTab === 'decision' && <TabDecision m={memo} user={user} saved={saved} setSaved={setSaved} refreshDeals={refreshDeals} onSaveToTracker={onSaveToTracker}/>}
        {activeTab === 'export'   && <TabExport   m={memo}/>}
      </div>
    </div>
  )
}

// ─── Main Screener ────────────────────────────────────────────────────────────
export default function Screener({ user, apiKey, tvKey, slackHook, deals, refreshDeals, initialCompany, onClearInitial }) {
  const [name,     setName]     = useState('')
  const [desc,     setDesc]     = useState('')
  const [deckB64,  setDeckB64]  = useState(null)
  const [deckName, setDeckName] = useState('')
  const [memo,     setMemo]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [loadStep, setLoadStep] = useState('')
  const [error,    setError]    = useState('')
  const [saved,    setSaved]    = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [isPortco, setIsPortco] = useState(false)

  useEffect(() => {
    setIsPortco(PORTFOLIO_NAMES.some(p => name.toLowerCase().includes(p.toLowerCase())))
  }, [name])

  useEffect(() => {
    if (initialCompany) { setName(initialCompany); onClearInitial?.() }
  }, [initialCompany])

  const handleFile = (file) => {
    if (!file || !file.name.endsWith('.pdf')) return
    const r = new FileReader()
    r.onload = () => { setDeckB64(r.result.split(',')[1]); setDeckName(file.name) }
    r.readAsDataURL(file)
  }

  const generate = async () => {
    if (!name && !deckB64) return
    if (!apiKey) { setError('No Claude API key — go to Settings and add it.'); return }
    setLoading(true); setError(''); setMemo(null); setSaved(false)
    try {
      let ctx = name ? `Company: ${name}` : 'Analyze this pitch deck'
      if (desc) ctx += '\nContext: ' + desc

      const portcoMatch = PORTFOLIO.find(p => name.toLowerCase().includes(p.name.toLowerCase()))
      if (portcoMatch) ctx += `\n\nNOTE: ${portcoMatch.name} is an EXISTING GIGF portfolio company (${portcoMatch.stage}, ${portcoMatch.sector}, ${portcoMatch.co2}). Mark recommendation_rationale as "PORTFOLIO COMPANY - Already invested." Score conservatively based on publicly available information.`

      setLoadStep('Running 5 research agents in parallel…')
      const enriched = name ? await enrichCompany(name, tvKey) : ''
      if (enriched?.trim().length > 100) ctx += enriched
      else if (name) ctx += '\n\n[STEALTH MODE - MINIMAL PUBLIC FOOTPRINT]\nScoring: weight team and impact integrity over market data. Lower confidence. Recommend direct founder outreach.'

      setLoadStep('Agent 6: GIGF IC analysis…')
      let raw
      if (deckB64) {
        const headers = { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
        if (apiKey) headers['x-api-key'] = apiKey
        const body = { model: 'claude-haiku-4-5-20251001', max_tokens: 4096, system: MEMO_SYSTEM, messages: [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: deckB64 } }, { type: 'text', text: ctx }] }] }
        const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) })
        const d = await res.json()
        raw = d.content.filter(b => b.type === 'text').map(b => b.text).join('')
        setDeckB64(null); setDeckName('')
      } else {
        raw = await claudeAPI(MEMO_SYSTEM, ctx, apiKey)
      }

      setLoadStep('Parsing memo…')
      const m = parseJSON(raw)
      setMemo(m)
    } catch(e) { setError(e.message || 'Generation failed. Check API key and try again.') }
    setLoading(false); setLoadStep('')
  }

  const handleSaveToTracker = async (humanDecision, notes, agree, divergenceCat, gdprConsent) => {
    if (!memo || !user?.uid) return
    // saveDeal already imported at top
    await saveDeal(user.uid, {
      company: memo.company, sector: memo.sector, stage: memo.stage,
      score: memo.thesis_fit_score, rec: memo.recommendation, conf: memo.confidence_level || 'Medium',
      humanStatus: humanDecision, humanDecision, notes, aiAgree: agree,
      divergence: memo.recommendation !== humanDecision,
      divergenceCategory: memo.recommendation !== humanDecision ? (divergenceCat || '') : '',
      gdprConsent: gdprConsent || false, memo,
    })
    await refreshDeals()
    setSaved(true)
  }

  const criteria = [
    ['Sector',       '5 ecological transition sectors'],
    ['Stage',        'Series B/C, >15% revenue growth'],
    ['Impact',       'Article 9 SFDR + GREENFIN eligible'],
    ['Ticket',       'EUR 5-30M, pure equity, no leverage'],
    ['Geography',    'Europe only'],
    ['Profitability','Path within 12-24 months'],
  ]

  return (
    <div>
      <div className="mb-6">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: G }}>GIGF Screener</p>
        <h2 className="text-2xl font-bold text-white mt-1">Impact Memo Generator</h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(232,245,238,0.4)' }}>Screen any company against GIGF's 4 mandatory criteria + 5 sector thesis. Includes AI analysis appendix.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
        {/* LEFT */}
        <div className="space-y-4">
          <div className="rounded-xl p-5 space-y-4" style={{ background: 'rgba(15,45,23,0.6)', border: '1px solid rgba(74,158,107,0.15)' }}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-medium" style={{ color: 'rgba(232,245,238,0.5)' }}>Company Name</p>
                {isPortco && <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: `${GD}0.15)`, color: G, border: `1px solid ${GD}0.25)` }}>🌱 Portfolio</span>}
              </div>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Chargepoly, iwell, Oxand, or new company…"
                onKeyDown={e => e.key === 'Enter' && generate()}
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-white/20"
                style={{ background: 'rgba(10,31,15,0.8)', border: '1px solid rgba(232,245,238,0.1)', focusBorderColor: G }}
                onFocus={e => e.target.style.borderColor = G}
                onBlur={e => e.target.style.borderColor = 'rgba(232,245,238,0.1)'}/>
            </div>

            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'rgba(232,245,238,0.5)' }}>Context (optional)</p>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
                placeholder="Paste pitch excerpt, URL, or context"
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-white/20 resize-none"
                style={{ background: 'rgba(10,31,15,0.8)', border: '1px solid rgba(232,245,238,0.1)' }}/>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => document.getElementById('pdf-up').click()}
              className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors duration-200"
              style={{ borderColor: dragOver ? G : 'rgba(232,245,238,0.15)', background: dragOver ? `${GD}0.05)` : 'transparent' }}>
              <input type="file" id="pdf-up" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])}/>
              {deckName
                ? <div className="flex items-center justify-center gap-2 text-sm" style={{ color: G }}>✓ {deckName}</div>
                : <div>
                    <p className="text-xs" style={{ color: 'rgba(232,245,238,0.3)' }}>Drop pitch deck PDF or click to upload</p>
                  </div>
              }
            </div>

            <button onClick={generate} disabled={loading || (!name && !deckB64)}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-wait"
              className="bg-gold text-navy disabled:opacity-40">
              {loading && <div className="w-4 h-4 border-2 border-[#0a1f0f] border-t-transparent rounded-full animate-spin"/>}
              {loading ? loadStep || 'Generating…' : 'Generate GIGF Impact Memo'}
            </button>

            {error && <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>{error}</div>}
          </div>

          {/* Thesis panel */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(15,45,23,0.6)', border: '1px solid rgba(74,158,107,0.15)' }}>
            <p className="text-[9px] font-bold tracking-[0.15em] uppercase mb-3" style={{ color: G }}>GIGF Thesis</p>
            {criteria.map(([k,v]) => (
              <div key={k} className="flex gap-3 py-1.5 text-xs" style={{ borderBottom: '1px solid rgba(232,245,238,0.05)' }}>
                <span className="w-24 flex-shrink-0" style={{ color: 'rgba(232,245,238,0.3)' }}>{k}</span>
                <span style={{ color: 'rgba(232,245,238,0.6)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="min-h-[600px]">
          {!memo && !loading && (
            <div className="h-full min-h-[500px] flex items-center justify-center p-8 rounded-xl" style={{ background: 'rgba(15,45,23,0.4)', border: '1px solid rgba(74,158,107,0.1)' }}>
              <div className="text-center">
                <div className="text-4xl mb-3">🌿</div>
                <p className="font-semibold text-white">Enter a company and generate</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(232,245,238,0.35)' }}>5 parallel agents: Founders · Growth · Competitors · Impact · Market</p>
              </div>
            </div>
          )}
          {loading && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-8 gap-4 rounded-xl" style={{ background: 'rgba(15,45,23,0.4)', border: '1px solid rgba(74,158,107,0.1)' }}>
              <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${G} transparent ${G} ${G}` }}/>
              <div className="text-center">
                <p className="text-sm" style={{ color: 'rgba(232,245,238,0.6)' }}>{loadStep || 'Running agents…'}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(232,245,238,0.25)' }}>Scoring against GIGF 4 criteria + impact assessment</p>
              </div>
            </div>
          )}
          {memo && (
            <div className="p-5 min-h-[500px] flex flex-col rounded-xl" style={{ background: 'rgba(15,45,23,0.6)', border: '1px solid rgba(74,158,107,0.15)' }}>
              <MemoOutput memo={memo} user={user} saved={saved} setSaved={setSaved} refreshDeals={refreshDeals} onSaveToTracker={handleSaveToTracker}/>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
