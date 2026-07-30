import { useState, useEffect, useCallback } from "react"
import { enrichCompany, claudeAPI, tavily, PORTFOLIO, NEWS_SOURCES } from "../api"

// ─── Morning Briefing Agent ───────────────────────────────────────────────────
async function runMorningBriefingAgent(apiKey, tvKey, deals, slackHook, onStep) {
  const results = { portfolio: [], alerts: [], pipeline: null, errors: [] }

  // Step 1: Portfolio pulse (parallel)
  onStep("Scanning 8 portfolio companies…")
  const portcoSearches = PORTFOLIO.slice(0,4).map(p =>
    tavily(`${p.name} news funding competitive threat 2025`, tvKey).catch(() => null)
  )
  const portcoResults = await Promise.allSettled(portcoSearches)
  portcoResults.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value?.results?.length > 0) {
      results.portfolio.push({
        name: PORTFOLIO[i].name,
        headline: r.value.results[0]?.title || "No recent news",
        url: r.value.results[0]?.url || "",
      })
    }
  })

  // Step 2: Deal alerts (parallel Tavily)
  onStep("Scanning EU FinTech deal flow…")
  const alertSearches = NEWS_SOURCES.slice(0,3).map(q => tavily(q, tvKey).catch(() => null))
  const alertResults = await Promise.allSettled(alertSearches)
  alertResults.forEach(r => {
    if (r.status === "fulfilled" && r.value?.results?.length > 0) {
      results.alerts.push(...r.value.results.slice(0,2).map(x => ({ headline: x.title, url: x.url })))
    }
  })

  // Step 3: Pipeline summary
  onStep("Generating AI briefing…")
  const pipelineSummary = deals.length > 0
    ? deals.slice(0,10).map(d => `${d.company} (${d.sector||"?"}, ${d.score||"?"}pts, ${d.humanStatus||"Screening"})`).join(", ")
    : "Pipeline empty — no deals screened yet"

  const briefPrompt = `Generate a sharp 5-line GIGF morning briefing for ${new Date().toLocaleDateString("en-GB", {weekday:"long", day:"numeric", month:"long"})}.

Portfolio news: ${results.portfolio.map(p => `${p.name}: ${p.headline}`).join(" | ") || "No major news"}
Deal flow: ${results.alerts.slice(0,4).map(a => a.headline).join(" | ") || "No alerts"}
Pipeline: ${pipelineSummary}

Format: 1) Market theme today 2) Portfolio flag (if any urgent) 3) Top deal opportunity from alerts 4) Priority action for the day 5) One-line IC readiness update. Be sharp, VC-terse.`

  const brief = await claudeAPI("You are a senior GIGF Tech analyst. Write concise institutional VC briefings.", briefPrompt, apiKey)
    .catch(e => `Briefing error: ${e.message}`)
  results.pipeline = brief

  // Step 4: Post to Slack if webhook set
  if (slackHook && brief && !brief.startsWith("Briefing error")) {
    onStep("Posting to Slack…")
    const slackMsg = `⚡ *GIGF Intelligence — Morning Briefing ${new Date().toLocaleDateString("en-GB")}*\n\n${brief}\n\n_Automated by GIGF Intelligence_`
    await fetch(slackHook, {
      method: "POST",
      body: JSON.stringify({ text: slackMsg }),
      headers: { "Content-Type": "application/json" },
    }).catch(() => {})
  }

  return results
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
}

function ScoreColor(s) { return s >= 70 ? "text-green-400" : s >= 45 ? "text-amber-400" : "text-red-400" }
function ScoreBg(s)    { return s >= 70 ? "bg-green-400"  : s >= 45 ? "bg-amber-400"  : "bg-red-400"   }

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "text-white" }) {
  return (
    <div className="bg-navy-2 border border-white/10 rounded-xl p-4">
      <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-1">{label}</p>
      <p className={`font-mono text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LoginDashboard({ user, apiKey, tvKey, slackHook, deals = [], calendarEvents = [], onNavigate, onDismiss }) {
  const [clock, setClock] = useState(new Date().toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" }))
  const [briefing, setBriefing] = useState(null)
  const [briefStep, setBriefStep] = useState("")
  const [briefLoading, setBriefLoading] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" })), 60000)
    return () => clearInterval(t)
  }, [])

  const safeName = user?.displayName?.split(" ")[0] || "Analyst"
  const safeDeals = Array.isArray(deals) ? deals : []

  const invested   = safeDeals.filter(d => d.humanStatus === "Invested").length
  const icReview   = safeDeals.filter(d => d.humanStatus === "IC Review").length
  const highScore  = safeDeals.filter(d => (d.score || 0) >= 70).length

  const runBriefing = useCallback(async () => {
    if (!apiKey) { setBriefing({ error: "No Claude API key — go to Ops tab." }); return }
    setBriefLoading(true); setBriefing(null)
    try {
      const res = await runMorningBriefingAgent(apiKey, tvKey, safeDeals, slackHook, setBriefStep)
      setBriefing(res)
    } catch (e) {
      setBriefing({ error: e.message })
    }
    setBriefLoading(false); setBriefStep("")
  }, [apiKey, tvKey, safeDeals, slackHook])

  const quickLinks = [
    { id:"screener",  icon:"⊹", label:"Screen Deal"   },
    { id:"inbox",     icon:"⌂", label:"Inbox"         },
    { id:"intel",     icon:"⚡", label:"Intel"         },
    { id:"radar",     icon:"◎", label:"Radar"         },
    { id:"tracker",   icon:"▤", label:"Tracker"       },
    { id:"calendar",  icon:"◷", label:"Calendar"      },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{greeting()}, {safeName}.</h1>
            <span className="font-mono text-gold text-xl font-bold">{clock}</span>
          </div>
          <p className="text-white/40 text-sm">{todayLabel()} · GIGF Intelligence</p>
        </div>
        {user?.photoURL && (
          <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-white/10 flex-shrink-0"/>
        )}
      </div>

      {/* Quick Launch */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {quickLinks.map(({ id, icon, label }) => (
          <button key={id} onClick={() => onNavigate?.(id)}
            className="flex flex-col items-center gap-1.5 bg-navy-2 border border-white/8 rounded-xl px-2 py-3 hover:border-gold/30 hover:bg-navy-3 transition-colors duration-200 group">
            <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-[9px] font-bold text-white/50 group-hover:text-white/80 text-center">{label}</span>
          </button>
        ))}
      </div>

      {/* Pipeline KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pipeline" value={safeDeals.length} sub="total screened"/>
        <StatCard label="INVEST" value={highScore} sub="score ≥70" color="text-green-400"/>
        <StatCard label="IC Review" value={icReview} sub="in committee" color="text-blue-400"/>
        <StatCard label="Invested" value={invested} sub="converted" color="text-gold"/>
      </div>

      {/* ── MORNING BRIEFING AGENT ── */}
      <div className="bg-navy-2 border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span>🧠</span>
            <h3 className="text-sm font-bold text-white">Morning Briefing Agent</h3>
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">MULTI-AGENT</span>
          </div>
          <button onClick={runBriefing} disabled={briefLoading}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors duration-200 flex items-center gap-2
              ${briefLoading ? "bg-white/5 text-white/30 cursor-wait" : "bg-gold text-navy hover:bg-gold-2"}`}>
            {briefLoading
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-transparent rounded-full animate-spin inline-block"/>
                  {briefStep || "Running…"}</>
              : "⚡ Run Briefing"}
          </button>
        </div>

        {!briefing && !briefLoading && (
          <div className="text-center py-6">
            <p className="text-white/30 text-sm mb-1">5 parallel agents: Portfolio pulse · Deal flow · Pipeline · Slack alert · AI synthesis</p>
            <p className="text-white/20 text-xs">Replaces your EU cleantech ecosystem monitoring</p>
          </div>
        )}

        {briefLoading && (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-3 bg-white/5 rounded animate-pulse"/>)}
          </div>
        )}

        {briefing?.error && (
          <p className="text-red-400 text-sm">{briefing.error}</p>
        )}

        {briefing && !briefing.error && (
          <div className="space-y-4">
            {/* AI Brief */}
            {briefing.pipeline && (
              <div className="bg-gold/6 border border-gold/15 rounded-xl p-4">
                <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-2">AI Synthesis</p>
                <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">{briefing.pipeline}</p>
              </div>
            )}

            {/* Portfolio signals */}
            {briefing.portfolio?.length > 0 && (
              <div>
                <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">Portfolio Pulse</p>
                <div className="space-y-1.5">
                  {briefing.portfolio.map((p, i) => (
                    <div key={i} className="flex items-start gap-2.5 bg-white/3 rounded-lg px-3 py-2">
                      <span className="text-blue-400 text-xs font-bold flex-shrink-0">{p.name}</span>
                      <p className="text-white/55 text-xs truncate">{p.headline}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deal alerts */}
            {briefing.alerts?.length > 0 && (
              <div>
                <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">Deal Flow Signals</p>
                <div className="space-y-1">
                  {briefing.alerts.slice(0,4).map((a, i) => (
                    <p key={i} className="text-xs text-white/45 truncate">→ {a.headline}</p>
                  ))}
                </div>
              </div>
            )}

            {slackHook && (
              <p className="text-[10px] text-green-400/60">✓ Posted to Slack</p>
            )}
          </div>
        )}
      </div>

      {/* Recent pipeline */}
      {safeDeals.length > 0 && (
        <div className="bg-navy-2 border border-white/10 rounded-xl p-5">
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-3">Recent Deals</p>
          <div className="space-y-2">
            {safeDeals.slice(0,5).map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{d.company}</p>
                  <p className="text-white/35 text-xs">{d.humanStatus || "Screening"}</p>
                </div>
                <span className={`font-mono text-sm font-bold ${ScoreColor(d.score||0)}`}>{d.score||"?"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
