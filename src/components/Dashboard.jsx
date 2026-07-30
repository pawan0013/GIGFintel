import { useState, useEffect } from 'react'
import Screener from './Screener'
import InboxScanner from './InboxScanner'
import NewsRadar from './NewsRadar'
import Portfolio from './Portfolio'
import Tracker from './Tracker'
import Assistant from './Assistant'
import Operations from './Operations'
import IntelligenceEngine from './IntelligenceEngine'
import PortcoAI from './PortcoAI'
import MeetingIntelligence from './MeetingIntelligence'
import Calendar from './Calendar'
import LoginDashboard from './LoginDashboard'

const NAV = [
  { id: 'dashboard', label: 'Briefing',  icon: '◈' },
  { id: 'screener',  label: 'Screener',  icon: '⊹' },
  { id: 'inbox',     label: 'Inbox',     icon: '⌂' },
  { id: 'radar',     label: 'Radar',     icon: '◎' },
  { id: 'intel',     label: 'Intel',     icon: '⚡', badge: 'NEW' },
  { id: 'portfolio', label: 'Portfolio', icon: '◫' },
  { id: 'portcoai',  label: 'Impact AI',  icon: '🌱' },
  { id: 'tracker',   label: 'Tracker',   icon: '▤' },
  { id: 'calendar',  label: 'Calendar',  icon: '◷' },
  { id: 'assistant', label: 'Assistant', icon: '⊛' },
  { id: 'ops',       label: 'Ops',       icon: '⚙' },
]

export default function Dashboard({
  user, apiKey, tvKey, gmailToken, setGmailToken,
  slackHook, deals, refreshDeals,
  onSetApiKey, onSetTvKey, onSetSlackHook, onLogout
}) {
  const [tab, setTab]                   = useState('dashboard')
  const [showBriefing, setShowBriefing] = useState(true)
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [initCompany, setInitCompany]   = useState('')

  // Gmail → Screener handoff via custom event
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.company) {
        setInitCompany(e.detail.company)
        setTab('screener')
      }
    }
    window.addEventListener('bf:screen-company', handler)
    return () => window.removeEventListener('bf:screen-company', handler)
  }, [])

  const safeName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Analyst'

  return (
    <div className="h-screen bg-navy flex overflow-hidden"
         style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden"
             onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-52 flex flex-col flex-shrink-0
        bg-[#0a1628] border-r border-white/8
        transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="px-5 py-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-tight leading-none">GIGF</p>
              <p className="text-gold text-[9px] font-bold tracking-[0.22em] uppercase mt-0.5">Meridiam</p>
            </div>
          </div>
        </div>

        <div className="mx-3 mt-2 mb-1 rounded-lg px-3 py-2 bg-white/4 border border-white/8">
          <p className="text-[8px] font-bold tracking-[0.18em] uppercase text-gold/80">Article 9 SFDR</p>
          <p className="text-[9px] text-white/35 mt-0.5">EUR 220M · GREENFIN Certified</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map(item => {
            const active = tab === item.id
            return (
              <button key={item.id}
                onClick={() => { setTab(item.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-all duration-150 relative
                  ${active ? 'text-gold bg-gold/10 border-r-2 border-gold' : 'text-white/50 hover:text-white/80 hover:bg-white/4'}`}>
                <span className={`text-base leading-none ${active ? 'text-gold' : 'text-white/30'}`}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-sm bg-gold/20 text-gold border border-gold/30">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2.5 mb-3">
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full border border-white/15 flex-shrink-0"/>
              : <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold text-xs font-bold">{safeName[0]?.toUpperCase()}</span>
                </div>
            }
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate leading-tight">{safeName}</p>
              <p className="text-white/35 text-[10px] mt-0.5">GIGF Analyst</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-2 text-white/30 hover:text-white/60 text-xs transition-colors duration-150">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0a1628] border-b border-white/8 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span className="text-white text-sm font-bold">GIGF Intelligence</span>
          <div className="w-8"/>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-7 w-full max-w-[1500px] mx-auto">

            {/* ── Always mounted — CSS hidden to preserve state across tab switches ── */}
            <div className={tab === 'dashboard' ? '' : 'hidden'}>
              {showBriefing
                ? <LoginDashboard user={user} apiKey={apiKey} tvKey={tvKey} slackHook={slackHook} deals={deals} calendarEvents={[]} onNavigate={setTab} onDismiss={() => setShowBriefing(false)}/>
                : <div className="bg-navy-2 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">Daily Briefing</p>
                      <p className="text-white/40 text-sm mt-0.5">Reopen your AI-powered morning brief</p>
                    </div>
                    <button onClick={() => setShowBriefing(true)} className="bg-gold text-navy rounded-xl px-4 py-2 font-bold text-sm hover:bg-gold-2 transition-colors">Reopen</button>
                  </div>
              }
            </div>

            <div className={tab === 'screener' ? '' : 'hidden'}>
              <Screener user={user} apiKey={apiKey} tvKey={tvKey} slackHook={slackHook}
                deals={deals} refreshDeals={refreshDeals}
                initialCompany={initCompany} onClearInitial={() => setInitCompany('')}/>
            </div>
            <div className={tab === 'inbox'     ? '' : 'hidden'}><InboxScanner user={user} apiKey={apiKey} gmailToken={gmailToken} setGmailToken={setGmailToken} deals={deals} refreshDeals={refreshDeals}/></div>
            <div className={tab === 'radar'     ? '' : 'hidden'}><NewsRadar  apiKey={apiKey} tvKey={tvKey}/></div>
            <div className={tab === 'intel'     ? '' : 'hidden'}><IntelligenceEngine apiKey={apiKey} tavilyKey={tvKey} deals={deals}/></div>
            <div className={tab === 'portfolio' ? '' : 'hidden'}><Portfolio  apiKey={apiKey} tvKey={tvKey}/></div>
            <div className={tab === 'tracker'   ? '' : 'hidden'}><Tracker    user={user} deals={deals} refreshDeals={refreshDeals} slackHook={slackHook}/></div>
            <div className={tab === 'calendar'  ? '' : 'hidden'}><Calendar   apiKey={apiKey} gmailToken={gmailToken} setGmailToken={setGmailToken} deals={deals}/></div>
            <div className={tab === 'assistant' ? '' : 'hidden'}><Assistant  apiKey={apiKey} deals={deals}/></div>
            <div className={tab === 'portcoai'  ? '' : 'hidden'}><PortcoAI   apiKey={apiKey} tvKey={tvKey}/></div>
            <div className={tab === 'meetings'  ? '' : 'hidden'}><MeetingIntelligence apiKey={apiKey}/></div>
            <div className={tab === 'ops'       ? '' : 'hidden'}><Operations apiKey={apiKey} tvKey={tvKey} slackHook={slackHook} onSetApiKey={onSetApiKey} onSetTvKey={onSetTvKey} onSetSlackHook={onSetSlackHook}/></div>

          </div>
        </main>
      </div>
    </div>
  )
}
