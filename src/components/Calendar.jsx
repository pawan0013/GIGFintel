import { useState, useEffect, useCallback } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dt) {
  if (!dt) return 'All day'
  return new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatTimeRange(start, end) {
  if (!start?.dateTime) return 'All day'
  const s = formatTime(start.dateTime)
  const e = end?.dateTime ? formatTime(end.dateTime) : null
  return e ? `${s} – ${e}` : s
}

function getDayLabel(dateStr) {
  const eventDate = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
  const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (same(eventDate, today)) return 'Today'
  if (same(eventDate, tomorrow)) return 'Tomorrow'
  return eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function getEventDateKey(event) {
  return (event.start?.dateTime || event.start?.date || '').substring(0, 10)
}

function isPast(event) {
  const dt = event.end?.dateTime || event.end?.date
  if (!dt) return false
  return new Date(dt) < new Date()
}

function extractMeetLink(event) {
  if (event.hangoutLink) return { url: event.hangoutLink, label: 'Join Meet' }
  const combined = (event.location || '') + ' ' + (event.description || '')
  const zoom = combined.match(/https:\/\/[a-z0-9.]*zoom\.us\/[^\s"<>]+/i)
  if (zoom) return { url: zoom[0], label: 'Join Zoom' }
  const teams = combined.match(/https:\/\/teams\.microsoft\.com\/[^\s"<>]+/i)
  if (teams) return { url: teams[0], label: 'Join Teams' }
  return null
}

function getAttendeeDisplay(attendees) {
  if (!attendees?.length) return null
  const names = attendees.filter(a => !a.self).map(a => a.displayName?.split(' ')[0] || a.email?.split('@')[0] || 'Unknown')
  if (!names.length) return null
  if (names.length <= 3) return names.join(', ')
  return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`
}

// ─── Claude call ──────────────────────────────────────────────────────────────

async function callClaude(apiKey, message) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: 'You are a senior VC analyst assistant for BlackFin Tech. Be concise and actionable.',
      messages: [{ role: 'user', content: message }],
    }),
  })
  if (!res.ok) throw new Error(`Claude API error ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// ─── PrepCard ──────────────────────────────────────────────────────────────────

function PrepCard({ event, apiKey, deals }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const topDeals = (deals || []).slice(0, 5).map(d => `${d.company || 'Deal'} (${d.stage || 'Pipeline'})`).join(', ')
  const attendeeFull = event.attendees?.filter(a => !a.self).map(a => a.displayName || a.email).join(', ') || 'No external attendees'
  const timeRange = formatTimeRange(event.start, event.end)

  async function handlePrep() {
    if (result) { setOpen(o => !o); return }
    setLoading(true); setError(null); setOpen(true)
    try {
      const prompt = `Prepare me for: "${event.summary}" at ${timeRange} with ${attendeeFull}.
Pipeline: ${topDeals || 'None'}.
Portcos: Hawk AI, Akur8, Cryptio, Formalize, Descartes, Epsor, Pretto, TransFICC.
Return ONLY valid JSON: {"talking_points":["...","...","..."],"questions":["...","..."],"context":"...","next_action":"..."}`
      const raw = await callClaude(apiKey, prompt)
      setResult(JSON.parse(raw.replace(/```json|```/g, '').trim()))
    } catch { setError('Failed to generate prep. Try again.') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <button onClick={handlePrep} disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-wide hover:bg-gold/20 transition-colors duration-200 disabled:opacity-50">
        {loading ? <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Prepping…</> : '⚡ Prep'}
      </button>
      {open && (result || error) && (
        <div className="mt-3 bg-navy-3 border border-white/10 rounded-xl p-4 space-y-3">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {result && <>
            <div>
              <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-2">Talking Points</p>
              <ul className="space-y-1.5">{result.talking_points?.map((p, i) => <li key={i} className="flex gap-2 text-sm text-white/70"><span className="text-gold/50 shrink-0">{i + 1}.</span>{p}</li>)}</ul>
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">Questions to Ask</p>
              <ul className="space-y-1">{result.questions?.map((q, i) => <li key={i} className="text-sm text-white/60">• {q}</li>)}</ul>
            </div>
            {result.context && <div><p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-1">Context</p><p className="text-sm text-white/60">{result.context}</p></div>}
            {result.next_action && <div className="bg-gold/8 border border-gold/20 rounded-lg px-3 py-2"><p className="text-xs font-semibold text-gold">→ {result.next_action}</p></div>}
          </>}
        </div>
      )}
    </div>
  )
}

// ─── FollowUpCard ──────────────────────────────────────────────────────────────

function FollowUpCard({ event, apiKey }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate() {
    setLoading(true); setError(null)
    try {
      const attendeeFull = event.attendees?.filter(a => !a.self).map(a => a.displayName || a.email).join(', ') || 'attendees'
      const prompt = `Draft a follow-up email after "${event.summary}" with ${attendeeFull}.
Meeting notes: ${notes || 'No specific notes provided.'}
Write a professional 3-sentence follow-up. Return ONLY the email body.`
      setDraft(await callClaude(apiKey, prompt))
    } catch { setError('Failed to draft follow-up. Try again.') }
    finally { setLoading(false) }
  }

  function handleCopy() {
    navigator.clipboard.writeText(draft)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-bold uppercase tracking-wide hover:bg-white/10 transition-colors duration-200">
        ✉ Follow-up
      </button>
      {open && (
        <div className="mt-3 bg-navy-3 border border-white/10 rounded-xl p-4 space-y-3">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add meeting notes (optional)…"
            className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none placeholder:text-white/20 resize-none" rows={3} />
          <button onClick={handleGenerate} disabled={loading}
            className="bg-gold text-navy rounded-xl px-4 py-2 font-bold text-sm hover:bg-gold-2 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2">
            {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
            {loading ? 'Generating…' : 'Generate Draft'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {draft && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold">Draft</p>
                <button onClick={handleCopy} className="text-xs text-white/40 hover:text-white/70 transition-colors duration-200">{copied ? '✓ Copied' : 'Copy'}</button>
              </div>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{draft}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── CalendarToolbar ──────────────────────────────────────────────────────────

function CalendarToolbar({ lastFetched, onRefresh, loading }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Calendar</h2>
        {lastFetched && <p className="text-white/40 text-xs mt-1">Updated {lastFetched.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>}
      </div>
      <button onClick={onRefresh} disabled={loading}
        className="bg-gold text-navy rounded-xl px-4 py-2 font-bold text-sm hover:bg-gold-2 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2">
        {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
        {loading ? 'Loading…' : '↺ Refresh'}
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Calendar({ apiKey, gmailToken: initialToken, setGmailToken, deals }) {
  const [localToken, setLocalToken] = useState(initialToken || null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetched, setLastFetched] = useState(null)

  // Sync token if parent updates it (e.g. from Inbox)
  useEffect(() => {
    if (initialToken && initialToken !== localToken) {
      setLocalToken(initialToken)
    }
  }, [initialToken])

  const fetchEvents = useCallback(async (token) => {
    if (!token) return
    setLoading(true); setError(null)
    try {
      const now = new Date().toISOString()
      const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(week)}&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.status === 401) {
        setLocalToken(null)
        setGmailToken?.(null)
        setError('Session expired. Please reconnect Google.')
        return
      }
      if (!res.ok) throw new Error(`Calendar API error ${res.status}`)
      const data = await res.json()
      setEvents(data.items || [])
      setLastFetched(new Date())
    } catch (e) {
      setError('Failed to load calendar. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [setGmailToken])

  useEffect(() => {
    if (localToken) fetchEvents(localToken)
  }, [localToken, fetchEvents])

  async function handleConnect() {
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('https://www.googleapis.com/auth/calendar.readonly')
      provider.setCustomParameters({ prompt: 'consent' })
      const result = await signInWithPopup(auth, provider)
      const cred = GoogleAuthProvider.credentialFromResult(result)
      if (cred?.accessToken) {
        setLocalToken(cred.accessToken)
        setGmailToken?.(cred.accessToken)
      } else {
        setError('Could not retrieve Google access token.')
      }
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user') return
      setError('Google sign-in failed. Please try again.')
    }
  }

  const grouped = events.reduce((acc, event) => {
    const key = getEventDateKey(event)
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {})
  const sortedDays = Object.keys(grouped).sort()

  // ── No token ──
  if (!localToken) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Calendar</h2>
          <p className="text-white/40 text-sm mt-1">Next 7 days with AI prep & follow-up</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-navy-2 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Connect Google Calendar</h3>
            <p className="text-white/50 text-sm mb-3 leading-relaxed">
              View your next 7 days with AI-powered meeting prep and follow-up drafts.
            </p>
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2.5 mb-4 text-left">
              <p className="text-amber-400 text-xs font-semibold mb-1">⚠ Google verification notice</p>
              <p className="text-amber-400/70 text-xs leading-relaxed">
                Google will show a "not verified" screen. Click <strong>Advanced → Continue</strong> to proceed.
                Only read-only Calendar access is requested — no changes are made to your calendar.
              </p>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4 text-red-400 text-sm">{error}</div>}
            <button onClick={handleConnect}
              className="w-full bg-gold text-navy rounded-xl px-4 py-3 font-bold text-sm hover:bg-gold-2 transition-colors duration-200 flex items-center justify-center gap-2">
              Connect Google Calendar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Error with no events ──
  if (error && events.length === 0) {
    return (
      <div>
        <CalendarToolbar lastFetched={lastFetched} onRefresh={() => fetchEvents(localToken)} loading={loading} />
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="bg-navy-2 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
            <p className="text-white font-bold mb-2">Connection Issue</p>
            <p className="text-sm text-white/60 mb-5">{error}</p>
            <button onClick={() => { setError(null); setLocalToken(null); setGmailToken?.(null) }}
              className="bg-gold text-navy rounded-xl px-4 py-2.5 font-bold text-sm hover:bg-gold-2 transition-colors duration-200">
              Reconnect Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Connected ──
  return (
    <div>
      <CalendarToolbar lastFetched={lastFetched} onRefresh={() => fetchEvents(localToken)} loading={loading} />

      {error && (
        <div className="bg-amber-400/8 border border-amber-400/20 rounded-lg px-3 py-2.5 mb-4 flex items-center gap-2">
          <span className="text-amber-400">⚠</span>
          <p className="text-amber-400/90 text-sm flex-1">{error}</p>
          <button onClick={() => { setError(null); setLocalToken(null); setGmailToken?.(null) }}
            className="text-amber-400 text-xs font-bold hover:text-amber-300 transition-colors duration-200">Reconnect</button>
        </div>
      )}

      {loading && events.length === 0 && (
        <div className="space-y-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-24 bg-white/10 rounded mb-3" />
              <div className="bg-navy-2 border border-white/10 rounded-xl p-4"><div className="h-4 w-3/4 bg-white/10 rounded mb-2" /><div className="h-3 w-1/2 bg-white/10 rounded" /></div>
            </div>
          ))}
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-white/40 text-base mb-1">No events in the next 7 days</p>
            <p className="text-white/20 text-sm">Your calendar is clear</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {sortedDays.map(dayKey => (
          <div key={dayKey}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-white font-bold text-base">{getDayLabel(dayKey)}</h3>
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-white/30 text-xs">{grouped[dayKey].length} event{grouped[dayKey].length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {grouped[dayKey].map(event => {
                const meetLink = extractMeetLink(event)
                const attendeeDisplay = getAttendeeDisplay(event.attendees)
                const past = isPast(event)

                return (
                  <div key={event.id} className={`bg-navy-2 border rounded-xl p-4 transition-colors duration-200 ${past ? 'opacity-60 border-white/8' : 'border-white/10 hover:border-white/20'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-base leading-snug truncate">{event.summary || 'Untitled Event'}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-gold font-mono text-sm">{formatTimeRange(event.start, event.end)}</span>
                          {attendeeDisplay && <><span className="text-white/20">·</span><span className="text-white/50 text-sm truncate">{attendeeDisplay}</span></>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {meetLink && (
                          <a href={meetLink.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors duration-200">
                            {meetLink.label}
                          </a>
                        )}
                        {past && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-white/5 text-white/25 border border-white/10">Past</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {!past && <PrepCard event={event} apiKey={apiKey} deals={deals} />}
                      {past && <FollowUpCard event={event} apiKey={apiKey} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
