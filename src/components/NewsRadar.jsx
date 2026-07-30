import { useState } from 'react'
import { tavily, claudeAPI, parseJSON, NEWS_SYSTEM, NEWS_SOURCES } from '../api'
import { Card, Label, Button, Badge, Pill, Empty, Spinner } from './UI'

export default function NewsRadar({ apiKey, tvKey }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [rawText, setRawText] = useState('')
  const [error, setError] = useState('')
  const [lastFetch, setLastFetch] = useState(null)
  const [filter, setFilter] = useState('all')

  const fetchNews = async () => {
    if (!tvKey) { setError('Set Tavily key in settings'); return }
    setLoading(true); setError(''); setItems([])
    try {
      const allResults = await Promise.all(NEWS_SOURCES.slice(0, 6).map(q => tavily(q, tvKey)))
      const seen = new Set()
      const headlines = []
      allResults.forEach(res => {
        if (res?.results) {
          res.results.forEach(r => {
            if (!seen.has(r.title) && r.title) {
              seen.add(r.title)
              headlines.push(r.title)
            }
          })
        }
      })
      setRawText(headlines.join('\\n'))
      setLastFetch(new Date())
      await scoreHeadlines(headlines.join('\\n'))
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const scoreHeadlines = async (text) => {
    if (!text || !apiKey) return
    setScoring(true); setError('')
    try {
      const prompt = `You are a VC analyst. Score these EU fintech headlines for investment relevance.
Return ONLY a JSON array — nothing else, no explanation, start your response with [
Each item: {"headline":"","score":75,"label":"Hot Lead","company":"","signal_type":"Funding Round","why":"1 sentence","action":"Add to pipeline"}
Max 6 items. Headlines:
` + text.split('\\n').slice(0,10).join('\\n')

      const raw = await claudeAPI(NEWS_SYSTEM, prompt, apiKey)

      // Robust extraction — find first [ and matching ]
      const start = raw.indexOf('[')
      if (start === -1) {
        // Claude returned prose instead of JSON — parse headlines manually as fallback
        const lines = text.split('\\n').filter(l => l.trim().length > 20).slice(0,6)
        const fallback = lines.map((h,i) => ({
          headline: h.trim(),
          score: 55 - i*3,
          label: i < 2 ? 'Watch' : 'Monitor',
          company: '',
          signal_type: 'News',
          why: 'EU fintech signal — manual review recommended',
          action: 'Review'
        }))
        setItems(fallback)
        setError('Scoring model returned unstructured response — showing headlines unscored')
        setScoring(false); return
      }

      // Count brackets to find real end
      let depth = 0, inStr = false, end = -1
      for (let i = start; i < raw.length; i++) {
        const ch = raw[i]
        if (ch === '"' && (i === 0 || raw[i-1] !== '\\\\')) inStr = !inStr
        if (!inStr) {
          if (ch === '[') depth++
          else if (ch === ']') { if (--depth === 0) { end = i; break } }
        }
      }
      const jsonStr = end >= 0 ? raw.slice(start, end + 1) : raw.slice(start) + ']'
      const fixed = jsonStr.replace(/,\\s*([\\]\\}])/g, '$1')
      const parsed = JSON.parse(fixed)
      const sorted = Array.isArray(parsed) ? parsed.sort((a,b)=>b.score-a.score) : []
      if (sorted.length === 0) {
        setError('No deals scored above threshold. Try scanning again for fresh results.')
      } else {
        setItems(sorted)
      }
    } catch(e) {
      setError('Scoring failed: ' + (e.message || 'Unknown error') + ' — click Re-score to retry')
    }
    setScoring(false)
  }

  const sendDigest = async () => {
    const email = prompt('Send Monday digest to email:')
    if (!email || !items.length) return
    const top5 = items.filter(i=>i.score>=60).slice(0,5)
    const body = `GIGF Tech Weekly Digest\\n\\n${top5.map((i,n)=>`${n+1}. ${i.headline}\\nRelevance: ${i.score}/100 — ${i.why}\\nAction: ${i.action}\\n`).join('\\n')}`
    const subject = `GIGF Intel — Weekly Digest ${new Date().toLocaleDateString()}`
    if (typeof emailjs !== 'undefined') {
      // If EmailJS is configured
      alert('Digest prepared. EmailJS not configured in this build — export as PDF instead.')
    } else {
      // Fallback: open mail client
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }
  }

  const filtered = filter === 'all' ? items : items.filter(i => {
    if (filter === 'hot') return i.score >= 70
    if (filter === 'pipeline') return i.action?.includes('pipeline')
    return true
  })

  const scoreColor = s => s >= 70 ? 'text-green-400' : s >= 45 ? 'text-amber-400' : 'text-red-400'

  return (
    <div>
      <div className="mb-5">
        <Label>News Radar</Label>
        <h2 className="text-xl font-bold text-white mt-1">EU Cleantech Intelligence Feed</h2>
        <p className="text-white/40 text-sm mt-0.5">Scans 8 EU cleantech sources. Each headline scored against GIGF ecological transition thesis.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={fetchNews} loading={loading} className="flex-none">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          {loading ? 'Scanning sources...' : 'Scan EU Cleantech News'}
        </Button>
        {rawText && !loading && (
          <Button variant="secondary" onClick={()=>scoreHeadlines(rawText)} loading={scoring} className="flex-none">Re-score</Button>
        )}
        {items.length > 0 && (
          <Button variant="secondary" onClick={sendDigest} className="flex-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            Send Digest
          </Button>
        )}
      </div>

      {lastFetch && <p className="text-[10px] text-white/30 mb-3">Last scan: {lastFetch.toLocaleTimeString()} · {items.length} deals scored</p>}
      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {items.length > 0 && (
        <div className="flex gap-1.5 mb-4">
          {[{k:'all',l:'All'},{k:'hot',l:'Hot (70+)'},{k:'pipeline',l:'Pipeline Only'}].map(({k,l})=>(
            <button key={k} onClick={()=>setFilter(k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter===k?'bg-gold/20 text-gold border border-gold/30':'bg-white/5 text-white/40 hover:text-white/70'}`}>{l}</button>
          ))}
        </div>
      )}

      {!loading && !scoring && items.length === 0 && <Empty title="Click Scan EU Cleantech News to fetch latest deals" subtitle="Requires Tavily API key. Scans 8 sources including Sifted, Fintech Global, TechCrunch EU" icon="📡"/>}
      {scoring && <div className="flex items-center gap-3 py-8 justify-center"><Spinner/><p className="text-white/40 text-sm">Scoring against GIGF thesis...</p></div>}

      <div className="space-y-2">
        {filtered.map((item, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-white leading-snug">{item.headline}</p>
                <p className="text-xs text-white/40 mt-1">{item.why}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className={`font-mono font-bold text-xl ${scoreColor(item.score)}`}>{item.score}</span>
                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                  <div className="h-full rounded-full" style={{width:item.score+'%',background:item.score>=70?'#22c55e':item.score>=45?'#f59e0b':'#ef4444'}}/>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge>{item.label}</Badge>
              {item.company && <Pill>{item.company}</Pill>}
              <Pill>{item.signal_type}</Pill>
              <span className={`text-[10px] font-semibold ${item.action?.includes('pipeline')?'text-green-400':'text-white/30'}`}>→ {item.action}</span>
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 && !loading && !scoring && (
        <Card className="p-4 mt-4">
          <p className="text-[10px] font-bold text-gold uppercase tracking-wider mb-3">Sources Monitored</p>
          <div className="grid grid-cols-2 gap-1.5">
            {['Sifted.eu','Fintech Global','TechCrunch EU','The Banker','Altfi','Finextra','EU-Startups','Bloomberg FinTech'].map(s => (
              <div key={s} className="flex items-center gap-2 text-xs text-white/40"><div className="w-1 h-1 rounded-full bg-white/20"/>{s}</div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
