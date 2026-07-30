// ─── GIGF THESIS ──────────────────────────────────────────────────────────────
const THESIS = `Meridiam GIGF (Green Impact Growth Fund) — EUR 220M Article 9 SFDR growth equity fund.
MANDATE: European ecological transition companies. No leverage (pure equity). Minority or majority stakes.
STAGE: Series B/C. Proven business model. Revenue >EUR 1M. >15% annual growth. Profitable or path within 12-24mo.
TICKET: EUR 5-30M. Hold 12+3 years.
GEOGRAPHY: Europe only.
IMPACT: Article 9 SFDR + GREENFIN certified. Core metric: tCO2eq avoided per EUR M of portfolio turnover.
SDGs: Climate Action (13), Affordable Clean Energy (7), Sustainable Cities (11), Responsible Consumption (12), Life Below Water (14), Life on Land (15), Economic Growth (8).

FOUR MANDATORY INVESTMENT CRITERIA (all four must pass):
1. FAST-GROWING SME — >15% revenue growth/year, international or market consolidation potential
2. STRONG BUSINESS MODEL — market-validated strategy, profitable or profitability within 12-24 months
3. SOLID MANAGEMENT TEAM — entrepreneurial spirit, strongly committed via equity investment
4. POSITIVE ECOLOGICAL TRANSITION — business model IS the impact, not a reporting layer

FIVE TARGET SECTORS:
- Low-carbon economy: energy efficiency, renewable energy, smart grids, energy storage, decarbonization software
- Clean mobility: EV charging, electric fleet, sustainable transport tech
- Smart & sustainable cities: smart building, urban infrastructure, sustainable construction
- Circular economy: electronics refurbishment, waste reduction, material circularity
- Agrotech & Foodtech: precision agriculture, food waste reduction, digital catering

PORTFOLIO COMPANIES (scoring anchors):
- Chargepoly: heavy-duty EV charging, EUR 23M Series B (Jul 2026, lead) — Score 88. Clean mobility leader. Fast growing, proven B2B model, strong team with equity commitment, direct CO2 impact.
- iwell: smart battery storage + EMS, EUR 27M Series B (Apr 2025, lead) — Score 86. Low-carbon economy. Excellent growth metrics, Netherlands market leader, clear tCO2eq avoided metric.
- Oxand: asset lifecycle management software, majority stake (Jan 2025) — Score 82. Smart cities + low-carbon. SaaS model, France/NL/CH footprint, measurable energy efficiency impact.
- Exoès: EV thermal management engineering, EUR 35M (Dec 2021) — Score 79. Clean mobility. Deep tech moat, Bpifrance co-investor, Bordeaux-based.
- ESG Book: ESG data platform, USD 35M Series B (Jun 2022, co-lead) — Score 75. Low-carbon data layer. London-based, international scale potential.

SCORING RUBRIC — score each dimension 0-25:
- growth_momentum: Revenue growth rate vs 15% hurdle, international expansion potential, market consolidation opportunity, pipeline quality
- impact_integrity: Is ecology core to the business model or a reporting layer? Measurable CO2eq/SDG alignment, Article 9 compliance, GREENFIN eligibility
- team_commitment: Founder equity commitment, entrepreneurial track record, domain expertise in ecological transition, management depth
- business_model: Path to profitability (12-24mo), gross margin quality, unit economics, customer concentration risk, competitive moat

PASS (<45): no ecological transition angle, pre-revenue, leverage-dependent model, outside Europe, B2C without impact
WATCH (45-69): ecological angle exists but missing 1-2 mandatory criteria
INVEST (70+): all 4 mandatory criteria met, strong sector fit, measurable impact metric available`

export const MEMO_SYSTEM = `You are a senior investment analyst at Meridiam GIGF (Green Impact Growth Fund). ${THESIS}

Generate a rigorous IC-ready investment memo. Be precise. Include global perspective — how do global trends, competition, regulation and innovation shape this company's future beyond Europe?
For portfolio companies already listed, note "PORTFOLIO COMPANY - Already Invested" in recommendation_rationale.
Output ONLY valid compact JSON — no markdown, no prose:
{"company":"","tagline":"","stage":"","geography":"","sector":"","thesis_fit_score":75,"confidence_level":"Medium","recommendation":"INVEST","recommendation_rationale":"","scoring_breakdown":{"growth_momentum":{"score":20,"max":25,"note":""},"impact_integrity":{"score":18,"max":25,"note":""},"team_commitment":{"score":20,"max":25,"note":""},"business_model":{"score":17,"max":25,"note":""}},"mandatory_criteria":{"fast_growing":{"pass":true,"note":""},"strong_model":{"pass":true,"note":""},"solid_team":{"pass":true,"note":""},"ecological_impact":{"pass":true,"note":""}},"impact":{"co2_avoided":"","sdg_alignment":[],"article9_compliant":true,"impact_note":"","greenfin_eligible":true},"market":{"tam":"","sam":"","som":"","key_tailwind":""},"product":{"what_it_does":"","moat":"","vs_competitors":""},"global_perspective":{"tailwinds":"","threats":"","opportunity":""},"team":{"assessment":"","founder_market_fit":"High","equity_commitment":"High","key_gaps":""},"red_flags":["","","",""],"partner_questions":["","","","",""],"comparables":[{"company":"","round":"","relevance":""},{"company":"","round":"","relevance":""},{"company":"","round":"","relevance":""},{"company":"","round":"","relevance":""}],"diligence_questions":["","","","",""],"power_law_case":"","return_scenarios":{"base":"","bull":"","bear":""},"ai_analysis_note":""}`

export const NEWS_SYSTEM = `Senior analyst at Meridiam GIGF. ${THESIS}
Return ONLY a raw JSON array starting with [ ending with ]. No other text. Max 6 items:
[{"headline":"","score":80,"label":"Hot Lead","company":"","signal_type":"Funding Round","why":"","action":"Add to pipeline"}]`

export const EMAIL_SYSTEM = `Senior analyst at Meridiam GIGF. ${THESIS}
Output ONLY JSON: {"is_pitch":true,"company_name":"","founders":"","stage":"","brief_description":"","action":"Screen now","priority":"High","suggested_reply":""}`

export const PORTFOLIO_SYSTEM = `Senior analyst at Meridiam GIGF. ${THESIS}
Output ONLY valid JSON:
{"signal":"Positive","headline_development":"","competitive_threats":[""],"growth_signals":[""],"impact_update":"","recommended_action":""}`

export const ASSISTANT_SYSTEM = `You are the GIGF Intelligence AI, senior analyst for Meridiam Green Impact Growth Fund. ${THESIS}
Help with deal analysis, impact scoring, LP reports, meeting prep, ecological transition market research. Be sharp, impact-focused, and direct. Always consider the tCO2eq/EUR M metric.`

export const PORTCO_SYSTEM = `Senior analyst at Meridiam GIGF. ${THESIS}
Analyze portfolio company for GIGF quarterly board prep. Output ONLY valid JSON:
{"company":"","impact_headline":"","co2_update":"","needle_mover":"","what_is_overhyped":"","three_year_vision":"","founder_relationship_angle":"","sdg_progress":""}`

// Portfolio companies — for auto-detection
export const PORTFOLIO_NAMES = [
  "Chargepoly", "iwell", "Oxand", "Exoès", "Exoes", "ESG Book", "ESGBook"
]

export const PORTFOLIO = [
  { name: "Chargepoly", sector: "Clean Mobility",        stage: "Series B", co2: "Heavy-duty EV charging" },
  { name: "iwell",      sector: "Low-carbon Economy",    stage: "Series B", co2: "Battery storage EMS" },
  { name: "Oxand",      sector: "Smart Cities",          stage: "Growth",   co2: "Asset lifecycle optimization" },
  { name: "Exoès",      sector: "Clean Mobility",        stage: "Growth",   co2: "EV thermal management" },
  { name: "ESG Book",   sector: "Low-carbon Data",       stage: "Series B", co2: "ESG data infrastructure" },
]

export const NEWS_SOURCES = [
  "European cleantech startup funding Series B C 2025 2026",
  "EV charging clean mobility Europe venture capital 2026",
  "circular economy electronics refurbishment startup Europe",
  "energy storage battery smart grid startup funding Europe",
  "agrotech foodtech precision agriculture Europe investment",
  "sustainable cities smart building decarbonization startup",
  "Article 9 SFDR impact fund European growth equity deal",
  "CSRD climate disclosure ecological transition SME Europe",
]

export async function claudeAPI(system, userMsg, apiKey) {
  const headers = {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  }
  if (apiKey) headers["x-api-key"] = apiKey
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers,
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 8192, system, messages: [{ role: "user", content: userMsg }] }),
  })
  if (!r.ok) { const e = await r.text(); throw new Error("API " + r.status + ": " + e.slice(0,200)) }
  const d = await r.json()
  return d.content.filter(b => b.type === "text").map(b => b.text).join("")
}

export function parseJSON(text) {
  text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
  const firstArr = text.indexOf("["), firstObj = text.indexOf("{")
  let start, openChar, closeChar
  if (firstArr >= 0 && (firstObj < 0 || firstArr < firstObj)) {
    start = firstArr; openChar = "["; closeChar = "]"
  } else if (firstObj >= 0) {
    start = firstObj; openChar = "{"; closeChar = "}"
  } else throw new Error("No JSON in response")
  let depth = 0, inStr = false, esc = false, end = -1
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (esc) { esc = false; continue }
    if (ch === "\\" && inStr) { esc = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (!inStr) {
      if (ch === openChar) depth++
      else if (ch === closeChar) { if (--depth === 0) { end = i; break } }
    }
  }
  const close = openChar === "[" ? "]" : "}"
  let extracted = end >= 0 ? text.slice(start, end + 1) : text.slice(start) + close
  try { return JSON.parse(extracted) } catch (_) {}
  const fixed = extracted.replace(/,\s*([\]\}])/g, "$1")
  try { return JSON.parse(fixed) } catch (_) {}
  throw new Error("JSON parse failed: " + extracted.slice(0, 100))
}

export async function tavily(query, apiKey) {
  if (!apiKey) return null
  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, query, search_depth: "advanced", max_results: 6, include_answer: true }),
    })
    if (!r.ok) return null
    return r.json()
  } catch { return null }
}

export async function enrichCompany(companyName, tvKey) {
  if (!tvKey || !companyName) return ""
  const queries = [
    `${companyName} CEO founder team background LinkedIn 2024 2025`,
    `${companyName} revenue ARR funding round valuation 2024 2025 2026`,
    `${companyName} competitors market landscape Europe 2025 2026`,
    `${companyName} CO2 impact ESG sustainability GREENFIN Article 9 SFDR`,
    `${companyName} customers enterprise contracts partnerships B2B`,
    `${companyName} technology product how it works innovation`,
    `${companyName} news recent developments expansion 2025 2026`,
    `"${companyName}" site:crunchbase.com OR site:linkedin.com OR site:techcrunch.com`,
  ]
  const results = await Promise.allSettled(queries.map(q => tavily(q, tvKey)))
  const sections = ["FOUNDERS & TEAM","FINANCIALS & FUNDING","COMPETITIVE LANDSCAPE","IMPACT & SUSTAINABILITY","CUSTOMERS & PARTNERSHIPS","TECHNOLOGY & PRODUCT","RECENT NEWS","EXTERNAL PROFILES"]
  let context = ""
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value?.results?.length > 0) {
      context += `\n\n[${sections[i]}]\n`
      context += r.value.results.slice(0,4).map(x => `${x.title}: ${(x.content||"").slice(0,300)}`).join("\n")
      if (r.value.answer) context += `\nSummary: ${r.value.answer}`
    }
  })
  return context
}
