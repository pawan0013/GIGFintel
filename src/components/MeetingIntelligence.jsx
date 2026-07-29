import { useState } from 'react'
import { claudeAPI } from '../api'
import { Card, Label } from './UI'

const MEETING_SYSTEM = `You are a senior VC analyst at BlackFin Tech. Analyze meeting notes or call transcripts and extract structured intelligence.
Output ONLY valid JSON:
{
  "meeting_type": "Portfolio Review|Founder Call|LP Meeting|IC Prep|Due Diligence|Other",
  "company": "",
  "date_hint": "",
  "summary": "2-3 sentence sharp summary",
  "action_items": [{"owner": "BlackFin|Founder|Both", "action": "", "deadline": "Immediate|1 week|1 month", "priority": "HIGH|MEDIUM|LOW"}],
  "key_decisions": [""],
  "risks_flagged": [{"risk": "", "severity": "HIGH|MEDIUM|LOW", "mitigation": ""}],
  "positive_signals": [""],
  "red_flags": [""],
  "next_steps": "",
  "follow_up_email": "professional follow-up email body (3-4 sentences)",
  "ic_relevant": true,
  "ic_note": ""
}`

export default function MeetingIntelligence({ apiKey }) {
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('actions')

  const analyze = async () => {
    if (!notes.trim()) return
    if (!apiKey) { setError('No Claude API key — check Ops tab.'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const raw = await claudeAPI(MEETING_SYSTEM,
        `Analyze these meeting notes and extract structured intelligence:\n\n${notes}`, apiKey)
      const clean = raw.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim()
      const s = clean.indexOf('{'), e = clean.lastIndexOf('}')
      setResult(JSON.parse(clean.slice(s, e+1)))
    } catch(err) { setError(err.message || 'Analysis failed') }
    setLoading(false)
  }

  const copyEmail = () => {
    navigator.clipboard.writeText(result.follow_up_email)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const priorityColor = p => p === 'HIGH' ? 'text-red-400 bg-red-500/10 border-red-500/25' : p === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/25' : 'text-white/40 bg-white/5 border-white/15'
  const severityColor = s => s === 'HIGH' ? 'text-red-400' : s === 'MEDIUM' ? 'text-amber-400' : 'text-white/40'

  const tabs = [
    { id:'actions',  label:'Action Items', count: result?.action_items?.length },
    { id:'risks',    label:'Risks',        count: result?.risks_flagged?.length },
    { id:'signals',  label:'Signals',      count: (result?.positive_signals?.length||0) + (result?.red_flags?.length||0) },
    { id:'followup', label:'Follow-up',    count: null },
  ]

  return (
    <div>
      <div className="mb-6">
        <Label>Meeting Intelligence</Label>
        <h2 className="text-2xl font-bold text-white mt-2">Call Notes → Structured Intel</h2>
        <p className="text-white/40 text-sm mt-1">Paste any meeting notes or call transcript. Extract action items, risk flags, IC-relevant signals, and a ready-to-send follow-up email.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[420px_1fr] items-start">
        {/* Input */}
        <Card className="p-5 space-y-4">
          <p className="text-[10px] font-medium text-white/50">Meeting Notes / Transcript</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={14}
            placeholder={`Paste notes or transcript here...\n\nExample:\n"Call with Hawk AI CEO — discussed Q2 metrics. ARR $3.9M, up 40% YoY. Customer concentration: top 3 banks = 65% ARR. DORA pipeline strong. Flagright raised $10M last week — they're building similar. CEO wants intro to Deutsche Bank compliance team via BlackFin LP network. Next: send NDA, schedule product demo for Julien. Red flag: gross margin dropped 3pts to 71%."`}
            className="w-full bg-navy-3 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:border-gold focus:outline-none transition-colors placeholder:text-white/15 resize-none leading-relaxed"/>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={analyze} disabled={loading || !notes.trim()}
            className="w-full bg-gold text-navy rounded-xl py-3 font-bold text-sm hover:bg-gold-2 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {loading && <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"/>}
            {loading ? 'Analyzing…' : '⚡ Extract Intelligence'}
          </button>
        </Card>

        {/* Output */}
        <div>
          {!result && !loading && (
            <Card className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
              <span className="text-4xl mb-3">◈</span>
              <p className="text-white/40 text-sm mb-1">Paste meeting notes and click Analyze</p>
              <p className="text-white/20 text-xs">Works with raw notes, structured minutes, or Zoom/Teams transcripts</p>
            </Card>
          )}

          {loading && (
            <Card className="p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4"/>
              <p className="text-white/40 text-sm">Extracting action items, risks, and signals…</p>
            </Card>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Header */}
              <Card className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.company && <p className="text-white font-bold text-base">{result.company}</p>}
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-white/8 text-white/50 border border-white/10">{result.meeting_type}</span>
                      {result.ic_relevant && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25">IC Relevant</span>}
                    </div>
                    <p className="text-white/55 text-sm leading-relaxed">{result.summary}</p>
                    {result.ic_note && <p className="text-blue-400/80 text-xs mt-1">IC Note: {result.ic_note}</p>}
                  </div>
                </div>
              </Card>

              {/* Tab bar */}
              <div className="flex gap-0.5 bg-navy-3 border border-white/8 rounded-xl p-1">
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1
                      ${activeTab === t.id ? 'bg-gold text-navy' : 'text-white/40 hover:text-white/70'}`}>
                    {t.label}
                    {t.count > 0 && <span className={`text-[8px] rounded px-1 ${activeTab === t.id ? 'bg-navy/30' : 'bg-white/10'}`}>{t.count}</span>}
                  </button>
                ))}
              </div>

              {/* Actions tab */}
              {activeTab === 'actions' && (
                <Card className="p-4 space-y-2">
                  {(result.action_items||[]).length === 0 && <p className="text-white/30 text-sm">No action items extracted.</p>}
                  {(result.action_items||[]).map((a, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/3 rounded-xl p-3">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border flex-shrink-0 mt-0.5 ${priorityColor(a.priority)}`}>{a.priority}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">{a.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-white/35">Owner: {a.owner}</span>
                          <span className="text-white/15 text-[9px]">·</span>
                          <span className="text-[9px] text-white/35">{a.deadline}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {result.next_steps && (
                    <div className="bg-gold/8 border border-gold/20 rounded-xl p-3 mt-2">
                      <p className="text-[9px] font-bold text-gold uppercase tracking-wider mb-1">Next Steps</p>
                      <p className="text-sm text-white/70">{result.next_steps}</p>
                    </div>
                  )}
                </Card>
              )}

              {/* Risks tab */}
              {activeTab === 'risks' && (
                <Card className="p-4 space-y-2">
                  {(result.risks_flagged||[]).length === 0 && <p className="text-white/30 text-sm">No risks flagged.</p>}
                  {(result.risks_flagged||[]).map((r, i) => (
                    <div key={i} className="bg-white/3 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${severityColor(r.severity)}`}>⚑ {r.severity}</span>
                        <p className="text-white text-sm font-medium">{r.risk}</p>
                      </div>
                      {r.mitigation && <p className="text-white/45 text-xs">Mitigation: {r.mitigation}</p>}
                    </div>
                  ))}
                </Card>
              )}

              {/* Signals tab */}
              {activeTab === 'signals' && (
                <Card className="p-4 space-y-4">
                  {(result.positive_signals||[]).length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-green-400 mb-2">Positive Signals</p>
                      {result.positive_signals.map((s,i) => <p key={i} className="text-sm text-white/65 py-1 border-b border-white/5 last:border-0">✓ {s}</p>)}
                    </div>
                  )}
                  {(result.red_flags||[]).length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-red-400 mb-2">Red Flags</p>
                      {result.red_flags.map((f,i) => <p key={i} className="text-sm text-red-400/80 py-1 border-b border-red-500/10 last:border-0">⚑ {f}</p>)}
                    </div>
                  )}
                </Card>
              )}

              {/* Follow-up tab */}
              {activeTab === 'followup' && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gold">Follow-up Email Draft</p>
                    <button onClick={copyEmail}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white/80 transition-colors">
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{result.follow_up_email}</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
