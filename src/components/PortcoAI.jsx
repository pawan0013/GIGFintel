import { useState } from 'react'
import { claudeAPI, PORTFOLIO } from '../api'
import { Card, Label, Badge, Empty } from './UI'

const PORTCO_SYSTEM = `You are a senior AI strategy consultant with deep fintech expertise, advising GIGF Tech on how their portfolio companies should use AI.

Be specific, contrarian where warranted, and commercially sharp. Avoid generic "AI will transform X" statements.
Always anchor to specific regulations (DORA, NIS2, Solvency II, MiCA, 6AMLD), specific competitor moves, and specific revenue/cost levers.

Output ONLY valid JSON:
{
  "company": "",
  "sector": "",
  "ai_moves_needle": [
    {"area": "Product|Ops|GTM|Support|Risk", "impact": "HIGH|MEDIUM|LOW", "what": "specific AI application", "why": "specific business reason with numbers", "timeline": "Now|6-12mo|1-2yr"}
  ],
  "overhyped": [
    {"claim": "what people say AI will do", "reality": "why it won't work or is oversold", "reason": "regulatory/technical/commercial reason"}
  ],
  "three_year_vision": {
    "headline": "one punchy sentence on what the company becomes",
    "product_shift": "how the product changes",
    "moat_deepening": "how AI deepens the competitive moat",
    "new_revenue": "new revenue streams AI enables",
    "risk": "biggest risk if they get this wrong"
  },
  "do_this_first": "single most important AI move they should make in next 90 days",
  "dont_do_this": "biggest AI mistake they could make"
}`

export default function PortcoAI({ apiKey, tvKey }) {
  const [selected, setSelected] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activePortco, setActivePortco] = useState(null)

  const generate = async (portco) => {
    if (!apiKey) { setError('No Claude API key — check Ops tab.'); return }
    setLoading(true); setError(''); setAnalysis(null); setActivePortco(portco)

    try {
      const raw = await claudeAPI(PORTCO_SYSTEM,
        `Analyze ${portco.name} (${portco.sector}, ${portco.stage}).
Context: GIGF portfolio company. Alexandre is on the board.
Generate the complete AI opportunity analysis JSON.`, apiKey)

      const clean = raw.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim()
      const s = clean.indexOf('{'), e = clean.lastIndexOf('}')
      setAnalysis(JSON.parse(clean.slice(s, e+1)))
    } catch(err) {
      setError(err.message || 'Generation failed')
    }
    setLoading(false)
  }

  const exportDoc = () => {
    if (!analysis) return
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>${analysis.company} — AI Opportunity Analysis</title>
    <style>body{font-family:'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:2rem;font-size:12px;line-height:1.6;color:#1a1a1a}
    h1{font-size:22px;font-weight:800;color:#08122a;margin-bottom:.25rem}
    h2{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#666;margin:1.2rem 0 .5rem;border-bottom:1px solid #e5e5e5;padding-bottom:.2rem}
    .badge{display:inline-block;padding:.15rem .5rem;border-radius:4px;font-size:8px;font-weight:700;text-transform:uppercase}
    .high{background:#dcfce7;color:#166534}.med{background:#fef9c3;color:#713f12}.low{background:#fee2e2;color:#991b1b}
    .box{background:#f8f8f8;border-radius:6px;padding:.6rem;margin-bottom:.4rem}
    .gold{background:#fefce8;border-left:3px solid #c9a050;padding:.6rem .8rem}
    .footer{margin-top:1.5rem;padding-top:.5rem;border-top:1px solid #e5e5e5;font-size:8px;color:#999}
    @media print{button{display:none}}</style></head><body>`)
    w.document.write(`
    <p style="font-size:8px;color:#c9a050;font-weight:700;letter-spacing:.15em;text-transform:uppercase">GIGF Intel · Portco AI Analysis</p>
    <h1>${analysis.company}</h1>
    <p style="color:#555">${analysis.sector} · GIGF Portfolio</p>

    <h2>AI Moves the Needle — Today</h2>
    ${(analysis.ai_moves_needle||[]).map(a=>`
      <div class="box">
        <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.3rem">
          <span class="badge ${a.impact==='HIGH'?'high':a.impact==='MEDIUM'?'med':'low'}">${a.impact}</span>
          <strong>${a.area}: ${a.what}</strong>
          <span style="font-size:9px;color:#888;margin-left:auto">${a.timeline}</span>
        </div>
        <p style="margin:0;color:#555">${a.why}</p>
      </div>`).join('')}

    <h2>What's Overhyped</h2>
    ${(analysis.overhyped||[]).map(o=>`
      <div class="box">
        <p style="margin:0 0 .2rem"><strong>Claim:</strong> ${o.claim}</p>
        <p style="margin:0 0 .2rem;color:#991b1b"><strong>Reality:</strong> ${o.reality}</p>
        <p style="margin:0;color:#888;font-style:italic">${o.reason}</p>
      </div>`).join('')}

    <h2>3-Year AI-Augmented Vision</h2>
    <div class="gold"><strong>${analysis.three_year_vision?.headline||''}</strong></div>
    <p><strong>Product:</strong> ${analysis.three_year_vision?.product_shift||''}</p>
    <p><strong>Moat:</strong> ${analysis.three_year_vision?.moat_deepening||''}</p>
    <p><strong>New Revenue:</strong> ${analysis.three_year_vision?.new_revenue||''}</p>
    <p style="color:#991b1b"><strong>Risk:</strong> ${analysis.three_year_vision?.risk||''}</p>

    <h2>Do This First (Next 90 Days)</h2>
    <div class="gold">${analysis.do_this_first||''}</div>

    <h2>Don't Do This</h2>
    <p>${analysis.dont_do_this||''}</p>

    <div class="footer">GIGF Intel v2 · AI-assisted · ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
    <script>window.onload=()=>window.print()<\/script>
    </body></html>`)
    w.document.close()
  }

  const impactColor = (i) => i === 'HIGH' ? 'text-green-400 bg-green-500/10 border-green-500/25' : i === 'MEDIUM' ? 'text-amber-400 bg-amber-500/10 border-amber-500/25' : 'text-white/40 bg-white/5 border-white/15'
  const areaIcon = (a) => ({ Product:'⊹', Ops:'⚙', GTM:'◎', Support:'⊛', Risk:'⚖' }[a] || '◈')

  return (
    <div>
      <div className="mb-6">
        <Label>Portco Intelligence</Label>
        <h2 className="text-2xl font-bold text-white mt-2">AI Opportunity Analyzer</h2>
        <p className="text-white/40 text-sm mt-1">Sharp, specific AI strategy for each GIGF portfolio company. Where AI moves the needle, what's overhyped, and the 3-year vision.</p>
      </div>

      {/* Portco grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-6">
        {PORTFOLIO.map(p => (
          <button key={p.name} onClick={() => { setSelected(p); setAnalysis(null); setError('') }}
            className={`p-3 rounded-xl border text-left transition-all duration-200
              ${selected?.name === p.name ? 'border-gold/50 bg-gold/8' : 'border-white/10 bg-navy-2 hover:border-white/25'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border
                ${selected?.name === p.name ? 'text-gold bg-gold/10 border-gold/25' : 'text-white/30 bg-white/5 border-white/10'}`}>
                {p.stage}
              </span>
            </div>
            <p className="text-white text-sm font-bold leading-tight">{p.name}</p>
            <p className="text-white/35 text-[10px] mt-0.5 leading-tight">{p.sector}</p>
          </button>
        ))}
      </div>

      {/* Generate button */}
      {selected && (
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => generate(selected)} disabled={loading}
            className="bg-gold text-navy rounded-xl px-5 py-2.5 font-bold text-sm hover:bg-gold-2 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading && <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"/>}
            {loading ? 'Analyzing…' : `⚡ Analyze ${selected.name}`}
          </button>
          {analysis && (
            <button onClick={exportDoc} className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/5 transition-colors">
              Export PDF
            </button>
          )}
        </div>
      )}

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-4">{error}</div>}

      {!selected && <Empty title="Select a portfolio company above" subtitle="Get sharp AI strategy analysis anchored to specific regulations, competitive dynamics, and revenue levers." icon="◈"/>}

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-navy-2 border border-white/8 rounded-xl animate-pulse"/>)}
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-5">
          {/* Where AI moves the needle */}
          <Card className="p-5">
            <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-4">Where AI Moves the Needle — Today</p>
            <div className="space-y-3">
              {(analysis.ai_moves_needle||[]).map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/3 rounded-xl p-3.5">
                  <span className="text-base flex-shrink-0">{areaIcon(item.area)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${impactColor(item.impact)}`}>{item.impact}</span>
                      <span className="text-xs font-bold text-white/70">{item.area}: {item.what}</span>
                      <span className="text-[9px] text-white/30 ml-auto">{item.timeline}</span>
                    </div>
                    <p className="text-xs text-white/55 leading-relaxed">{item.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Overhyped */}
          <Card className="p-5">
            <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-amber-400 mb-4">What's Overhyped</p>
            <div className="space-y-3">
              {(analysis.overhyped||[]).map((item, i) => (
                <div key={i} className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-white/70 mb-1">{item.claim}</p>
                  <p className="text-xs text-amber-400/80 mb-1">↳ {item.reality}</p>
                  <p className="text-[10px] text-white/35 italic">{item.reason}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* 3-year vision */}
          <Card className="p-5">
            <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-3">3-Year AI-Augmented Vision</p>
            <div className="bg-gold/8 border border-gold/20 rounded-xl p-3.5 mb-3">
              <p className="text-sm font-bold text-white">{analysis.three_year_vision?.headline}</p>
            </div>
            <div className="space-y-2">
              {[
                ['Product Shift', analysis.three_year_vision?.product_shift, 'text-white/65'],
                ['Moat Deepening', analysis.three_year_vision?.moat_deepening, 'text-white/65'],
                ['New Revenue', analysis.three_year_vision?.new_revenue, 'text-green-400/80'],
                ['Risk if Wrong', analysis.three_year_vision?.risk, 'text-red-400/80'],
              ].map(([label, val, color]) => val ? (
                <div key={label} className="flex gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-[9px] font-bold text-white/25 uppercase w-24 flex-shrink-0 pt-0.5">{label}</span>
                  <p className={`text-xs ${color} leading-relaxed`}>{val}</p>
                </div>
              ) : null)}
            </div>
          </Card>

          {/* Do/Don't */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-green-400 mb-2">Do This First (90 Days)</p>
              <p className="text-sm text-white/70 leading-relaxed">{analysis.do_this_first}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-red-400 mb-2">Don't Do This</p>
              <p className="text-sm text-white/70 leading-relaxed">{analysis.dont_do_this}</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
