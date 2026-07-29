import { useState, useEffect, useCallback, useRef } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth, googleProvider, saveDeal } from '../firebase'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

function relativeTime(dateStr) {
  const date = new Date(dateStr)
  if (isNaN(date)) return 'Unknown'
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function extractName(fromHeader) {
  if (!fromHeader) return 'Unknown'
  const match = fromHeader.match(/^"?([^"<]+)"?\s*</)
  if (match) return match[1].trim().split(' ')[0]
  const emailMatch = fromHeader.match(/([^@<\s]+)@/)
  return emailMatch ? emailMatch[1] : fromHeader
}

function getHeader(headers, name) {
  const h = headers?.find(h => h.name.toLowerCase() === name.toLowerCase())
  return h?.value || ''
}

function categoryColor(cat) {
  const map = {
    PITCH: 'bg-red-500/20 text-red-400 border-red-500/30',
    LP_COMM: 'bg-gold/20 text-gold border-gold/30',
    PORTFOLIO_UPDATE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    WARM_INTRO: 'bg-green-500/20 text-green-400 border-green-500/30',
    FOLLOW_UP: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }
  return map[cat] || 'bg-white/10 text-white/50 border-white/20'
}

function categoryLabel(cat) {
  const map = { PITCH: 'Pitch', LP_COMM: 'LP', PORTFOLIO_UPDATE: 'Portfolio', WARM_INTRO: 'Intro', FOLLOW_UP: 'Follow-up' }
  return map[cat] || 'Other'
}

function priorityDot(priority) {
  if (priority === 'High') return 'bg-red-400'
  if (priority === 'Medium') return 'bg-amber-400'
  return 'bg-white/30'
}

function scoreColor(score) {
  if (score >= 70) return 'text-green-400'
  if (score >= 45) return 'text-amber-400'
  return 'text-red-400'
}

function scoreBg(score) {
  if (score >= 70) return 'bg-green-400'
  if (score >= 45) return 'bg-amber-400'
  return 'bg-red-400'
}

// ─── Gmail OAuth via Firebase (same flow as Calendar — no separate client ID needed) ──

async function connectGmailViaFirebase() {
  // Force fresh consent to get access_token with Gmail scope
  const provider = new GoogleAuthProvider()
  provider.addScope('https://www.googleapis.com/auth/gmail.readonly')
  provider.setCustomParameters({ prompt: 'consent', access_type: 'online' })
  const result = await signInWithPopup(auth, provider)
  const credential = GoogleAuthProvider.credentialFromResult(result)
  if (!credential?.accessToken) throw new Error('No access token returned')
  return credential.accessToken
}

// ─── Gmail API ────────────────────────────────────────────────────────────────

async function fetchGmailMessages(token, maxResults = 30) {
  const listResp = await fetch(`${GMAIL_BASE}/messages?maxResults=15`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!listResp.ok) {
    if (listResp.status === 401) throw new Error('TOKEN_EXPIRED')
    throw new Error('Failed to fetch message list')
  }
  const listData = await listResp.json()
  const messages = listData.messages || []

  const detailed = await Promise.all(
    messages.map(async (m) => {
      const resp = await fetch(
        `${GMAIL_BASE}/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!resp.ok) return null
      const data = await resp.json()
      const headers = data.payload?.headers || []
      return {
        id: m.id,
        subject: getHeader(headers, 'Subject') || '(No subject)',
        from: getHeader(headers, 'From') || 'Unknown',
        date: getHeader(headers, 'Date') || '',
        snippet: data.snippet || '',
        threadId: data.threadId,
      }
    })
  )
  return detailed.filter(Boolean)
}

async function batchClassifyEmails(apiKey, emails) {
  if (!apiKey) throw new Error('No Claude API key set. Add it in Ops → Settings.')

  const input = emails.map(e => ({
    id: e.id,
    subject: e.subject,
    from: e.from,
    snippet: e.snippet.slice(0, 200),
  }))

  const prompt = `Classify these emails for a BlackFin Tech VC analyst.
For each email output:
- category: PITCH | PORTFOLIO_UPDATE | LP_COMM | WARM_INTRO | FOLLOW_UP | OTHER
- company_name: string (if PITCH or WARM_INTRO, else null)
- relevance_score: 0-100 integer (if PITCH or WARM_INTRO, else null)
- suggested_action: "Screen now" | "Reply" | "Archive" | "Escalate"
- priority: "High" | "Medium" | "Low"
- brief_analysis: one sentence max

Input: ${JSON.stringify(input)}

Respond ONLY with a valid JSON array. No markdown. Array length must match input.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: 'You are an AI assistant for BlackFin Tech, a FinTech-focused VC fund.',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error(`Claude API error ${response.status}`)
  const data = await response.json()
  const raw = data.content?.[0]?.text || '[]'
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

async function generateDraftReply(apiKey, email, classification) {
  const prompt = `Draft a reply from Guillaume Fazekas, BlackFin Tech analyst.
Email from ${email.from}: Subject: ${email.subject}. Content: ${email.snippet}
Context: ${classification.brief_analysis}. Category: ${classification.category}.
Draft a professional 3-sentence reply. If PITCH: acknowledge interest, ask for pitch deck, suggest brief call.
Return ONLY the reply body text.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await response.json()
  return data.content?.[0]?.text || ''
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InboxScanner({ user, apiKey, gmailToken, setGmailToken, deals, refreshDeals }) {
  const [emails, setEmails] = useState([])
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState(null)
  const [activeTab, setActiveTab] = useState('All')
  const [expandedId, setExpandedId] = useState(null)
  const [draftMap, setDraftMap] = useState({})
  const [draftLoading, setDraftLoading] = useState({})
  const [lastScanned, setLastScanned] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const autoScanAttempted = useRef(false)

  useEffect(() => {
    const stored = localStorage.getItem('bf-last-scan')
    if (stored) setLastScanned(new Date(stored))
  }, [])

  const runScan = useCallback(async (token, silent = false) => {
    if (!token) return
    if (!silent) setScanError(null)
    setScanning(true)
    try {
      const rawEmails = await fetchGmailMessages(token, 30)
      const classifications = await batchClassifyEmails(apiKey, rawEmails)
      const merged = rawEmails.map((e, i) => {
        const cls = classifications.find(c => c.id === e.id) || classifications[i] || {}
        return { ...e, ...cls }
      })
      setEmails(merged)
      const now = new Date()
      setLastScanned(now)
      localStorage.setItem('bf-last-scan', now.toISOString())
    } catch (err) {
      if (err.message === 'TOKEN_EXPIRED') {
        setGmailToken(null)
        if (!silent) setScanError('Gmail session expired. Please reconnect.')
      } else {
        if (!silent) setScanError(err.message || 'Scan failed. Please try again.')
      }
    } finally {
      setScanning(false)
    }
  }, [apiKey, setGmailToken])

  // Auto-scan if token exists and stale >4h
  useEffect(() => {
    if (autoScanAttempted.current || !gmailToken) return
    const lastScan = localStorage.getItem('bf-last-scan')
    const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000
    if (!lastScan || new Date(lastScan).getTime() < fourHoursAgo) {
      autoScanAttempted.current = true
      runScan(gmailToken, true)
    }
  }, [gmailToken, runScan])

  const connectGmail = async () => {
    setConnecting(true)
    setScanError(null)
    try {
      const token = await connectGmailViaFirebase()
      setGmailToken(token)
      await runScan(token)
    } catch (err) {
      if (err.code === 'auth/popup-blocked') {
        setScanError('Popup blocked — allow popups for this site then try again.')
      } else if (err.code === 'auth/popup-closed-by-user') {
        setScanError('Sign-in cancelled.')
      } else {
        setScanError(err.message || 'Could not connect Gmail. Please try again.')
      }
    } finally {
      setConnecting(false)
    }
  }

  const handleDraftReply = async (email) => {
    setDraftLoading(prev => ({ ...prev, [email.id]: true }))
    try {
      const draft = await generateDraftReply(apiKey, email, email)
      setDraftMap(prev => ({ ...prev, [email.id]: draft }))
    } catch {
      setDraftMap(prev => ({ ...prev, [email.id]: 'Failed to generate reply. Please try again.' }))
    } finally {
      setDraftLoading(prev => ({ ...prev, [email.id]: false }))
    }
  }

  const handleScreenCompany = (companyName) => {
    window.dispatchEvent(new CustomEvent('bf:screen-company', { detail: { company: companyName } }))
  }

  const tabCounts = {
    All: emails.length,
    Pitches: emails.filter(e => e.category === 'PITCH').length,
    'LP Comms': emails.filter(e => e.category === 'LP_COMM').length,
    Portfolio: emails.filter(e => e.category === 'PORTFOLIO_UPDATE').length,
    Other: emails.filter(e => !['PITCH', 'LP_COMM', 'PORTFOLIO_UPDATE', 'WARM_INTRO'].includes(e.category)).length,
  }

  const filteredEmails = emails.filter(e => {
    if (activeTab === 'All') return true
    if (activeTab === 'Pitches') return e.category === 'PITCH'
    if (activeTab === 'LP Comms') return e.category === 'LP_COMM'
    if (activeTab === 'Portfolio') return e.category === 'PORTFOLIO_UPDATE'
    if (activeTab === 'Other') return !['PITCH', 'LP_COMM', 'PORTFOLIO_UPDATE', 'WARM_INTRO'].includes(e.category)
    return true
  })

  // ── NOT CONNECTED ──

  if (!gmailToken) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Smart Inbox</h2>
          <p className="text-white/40 text-sm mt-1">AI-classified deal flow from Gmail</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-navy-2 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Connect Gmail</h3>
            <p className="text-white/50 text-sm mb-3 leading-relaxed">
              Auto-classify pitches, LP comms, and portfolio updates using Claude AI.
            </p>
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2.5 mb-4 text-left">
              <p className="text-amber-400 text-xs font-semibold mb-1">⚠ Google verification notice</p>
              <p className="text-amber-400/70 text-xs leading-relaxed">
                Google will show a "not verified" screen. This is normal for internal tools under development.
                Click <strong>Advanced → Continue</strong> to proceed. Only read-only Gmail access is requested.
              </p>
            </div>
            {scanError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4 text-red-400 text-sm text-left">
                {scanError}
              </div>
            )}
            <button
              onClick={connectGmail}
              disabled={connecting}
              className="w-full bg-gold text-navy rounded-xl px-4 py-3 font-bold text-sm hover:bg-gold-2 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {connecting && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
              {connecting ? 'Connecting…' : 'Connect Gmail Account'}
            </button>
            <p className="text-white/20 text-xs mt-3">Uses your existing Google account — same OAuth as Calendar</p>
          </div>
        </div>
      </div>
    )
  }

  // ── CONNECTED ──

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Smart Inbox</h2>
          {lastScanned && <p className="text-white/40 text-xs mt-1">Last scanned {relativeTime(lastScanned)}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setGmailToken(null); setEmails([]) }} className="text-white/30 hover:text-white/60 transition-colors duration-200 text-xs">Disconnect</button>
          <button onClick={() => runScan(gmailToken)} disabled={scanning}
            className="bg-gold text-navy rounded-xl px-3 py-2 font-bold text-xs hover:bg-gold-2 transition-colors duration-200 disabled:opacity-50 flex items-center gap-1.5">
            {scanning
              ? <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Scanning…</>
              : <>↺ Scan Now</>}
          </button>
        </div>
      </div>

      {scanError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4 text-red-400 text-sm flex items-center gap-2">
          {scanError}
          <button onClick={() => setScanError(null)} className="ml-auto text-white/30 hover:text-white/60">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-white/10">
        {Object.entries(tabCounts).map(([t, count]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-3 py-2 text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 border-b-2 -mb-px ${activeTab === t ? 'text-gold border-gold' : 'text-white/40 border-transparent hover:text-white/70'}`}>
            {t}
            {count > 0 && <span className={`text-[9px] font-bold rounded px-1.5 py-0.5 ${activeTab === t ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white/40'}`}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Skeletons while scanning */}
      {scanning && emails.length === 0 && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-navy-2 border border-white/10 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-12 h-4 bg-white/10 rounded"/><div className="flex-1 h-4 bg-white/10 rounded"/><div className="w-16 h-3 bg-white/10 rounded"/>
              </div>
              <div className="w-3/4 h-3 bg-white/10 rounded mb-1"/><div className="w-1/2 h-3 bg-white/10 rounded"/>
            </div>
          ))}
        </div>
      )}

      {!scanning && filteredEmails.length === 0 && emails.length > 0 && (
        <div className="flex items-center justify-center py-16 text-white/30 text-sm">No emails in this category</div>
      )}

      {!scanning && emails.length === 0 && !scanError && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <p className="text-white/40 text-base mb-1">Gmail connected</p>
            <p className="text-white/20 text-sm mb-5">Hit "Scan Now" to classify your inbox</p>
            <button onClick={() => runScan(gmailToken)} className="bg-gold text-navy rounded-xl px-5 py-2.5 font-bold text-sm hover:bg-gold-2 transition-colors duration-200">Scan Inbox</button>
          </div>
        </div>
      )}

      {/* Email list */}
      {filteredEmails.length > 0 && (
        <div className="space-y-2">
          {filteredEmails.map((email) => {
            const isExpanded = expandedId === email.id
            const hasDraft = !!draftMap[email.id]
            const isDraftLoading = !!draftLoading[email.id]
            const showScore = email.category === 'PITCH' || email.category === 'WARM_INTRO'

            return (
              <div key={email.id} className={`bg-navy-2 border rounded-xl transition-colors duration-200 overflow-hidden ${isExpanded ? 'border-gold/30' : 'border-white/10 hover:border-white/20'}`}>
                <button onClick={() => setExpandedId(isExpanded ? null : email.id)} className="w-full text-left p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityDot(email.priority)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[9px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded border ${categoryColor(email.category)}`}>{categoryLabel(email.category)}</span>
                        <span className="text-white/70 text-sm font-semibold truncate">{extractName(email.from)}</span>
                        <span className="text-white/30 text-xs ml-auto shrink-0">{relativeTime(email.date)}</span>
                      </div>
                      <p className="text-white text-sm font-semibold truncate leading-snug">{email.subject}</p>
                      {email.brief_analysis && <p className="text-white/40 text-xs mt-1 line-clamp-1 leading-relaxed">{email.brief_analysis}</p>}
                      {showScore && email.relevance_score != null && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${scoreBg(email.relevance_score)}`} style={{ width: `${email.relevance_score}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold shrink-0 font-mono ${scoreColor(email.relevance_score)}`}>{email.relevance_score}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-3">
                    <p className="text-white/60 text-sm leading-relaxed mb-3">{email.snippet}</p>
                    <div className="flex items-center gap-3 mb-3 text-xs">
                      <span className="text-white/30">From</span><span className="text-white/70">{email.from}</span>
                      <div className="w-px h-3 bg-white/10" />
                      <span className="text-white/30">Action</span><span className="text-gold font-semibold">{email.suggested_action}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {email.category === 'PITCH' && email.company_name && (
                        <button onClick={() => handleScreenCompany(email.company_name)}
                          className="bg-gold text-navy rounded-xl px-3 py-2 font-bold text-xs hover:bg-gold-2 transition-colors duration-200">
                          Screen {email.company_name}
                        </button>
                      )}
                      <button onClick={() => handleDraftReply(email)} disabled={isDraftLoading || hasDraft}
                        className="bg-white/8 text-white/70 border border-white/10 rounded-xl px-3 py-2 font-semibold text-xs hover:border-white/20 hover:text-white transition-colors duration-200 disabled:opacity-50 flex items-center gap-1.5">
                        {isDraftLoading ? <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Drafting…</>
                          : hasDraft ? '✓ Draft Ready' : '✎ Draft Reply'}
                      </button>
                    </div>
                    {hasDraft && (
                      <div className="mt-3 bg-navy-3 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold bg-gold/10 border border-gold/20 px-2 py-1 rounded">Draft — Guillaume Fazekas</span>
                          <button onClick={() => navigator.clipboard.writeText(draftMap[email.id])} className="ml-auto text-white/30 hover:text-white/60 transition-colors duration-200 text-xs">Copy</button>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{draftMap[email.id]}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {scanning && emails.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-navy-2 border border-gold/30 rounded-xl px-4 py-2.5 flex items-center gap-2 z-50">
          <svg className="w-3 h-3 text-gold animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
          <span className="text-gold text-xs font-semibold">Refreshing inbox…</span>
        </div>
      )}
    </div>
  )
}
