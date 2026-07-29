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
  { id: 'dashboard', label: 'Briefing',    icon: '🌿', desc: 'Morning impact brief' },
  { id: 'screener',  label: 'Screener',    icon: '🔍', desc: 'GIGF thesis screener' },
  { id: 'inbox',     label: 'Inbox',       icon: '📬', desc: 'Pitch triage' },
  { id: 'radar',     label: 'Radar',       icon: '🌍', desc: 'Cleantech intelligence' },
  { id: 'intel',     label: 'Intel',       icon: '⚡', badge: 'NEW' },
  { id: 'portfolio', label: 'Portfolio',   icon: '🌱', desc: 'Portfolio signals' },
  { id: 'portcoai',  label: 'Impact AI',   icon: '♻️', desc: 'Portco analysis' },
  { id: 'tracker',   label: 'Tracker',     icon: '📋', desc: 'Pipeline & decisions' },
  { id: 'calendar',  label: 'Calendar',    icon: '🗓', desc: 'Meeting prep' },
  { id: 'assistant', label: 'Assistant',   icon: '🤖', desc: 'GIGF AI analyst' },
  { id: 'ops',       label: 'Settings',    icon: '⚙', desc: 'API keys & config' },
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

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.company) { setInitCompany(e.detail.company); setTab('screener') }
    }
    window.addEventListener('bf:screen-company', handler)
    return () => window.removeEventListener('bf:screen-company', handler)
  }, [])

  const safeName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Analyst'

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#0a1f0f', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}/>
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-52 flex flex-col flex-shrink-0
        transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto`}
        style={{ background: '#0a1f0f', borderRight: '1px solid rgba(74,158,107,0.12)' }}>

        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(74,158,107,0.12)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(74,158,107,0.15)', border: '1px solid rgba(74,158,107,0.3)' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 C12 2 21 7 21 14 C21 19.5 17 22.5 12 22.5 C7 22.5 3 19.5 3 14 C3 7 12 2 12 2Z" fill="rgba(74,158,107,0.3)" stroke="#4a9e6b" strokeWidth="1.5"/>
                <path d="M12 22.5 L12 10" stroke="#4a9e6b" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-tight leading-none">GIGF Intel</p>
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5" style={{ color: '#4a9e6b' }}>Meridiam</p>
            </div>
          </div>
        </div>

        {/* Impact badge */}
        <div className="mx-3 my-3 rounded-lg px-3 py-2" style={{ background: 'rgba(74,158,107,0.08)', border: '1px solid rgba(74,158,107,0.15)' }}>
          <p className="text-[8px] font-bold tracking-widest uppercase mb-1" style={{ color: '#4a9e6b' }}>Article 9 SFDR</p>
          <p className="text-[9px]" style={{ color: 'rgba(232,245,238,0.5)' }}>EUR 220M · GREENFIN Certified</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-1">
          {NAV.map(item => {
            const active = tab === item.id
            return (
              <button key={item.id}
                onClick={() => { setTab(item.id); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-all duration-150 relative"
                style={{
                  color: active ? '#4a9e6b' : 'rgba(232,245,238,0.45)',
                  background: active ? 'rgba(74,158,107,0.1)' : 'transparent',
                  borderRight: active ? '2px solid #4a9e6b' : '2px solid transparent',
                }}>
                <span className="text-base leading-none">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-sm"
                    style={{ background: 'rgba(74,158,107,0.2)', color: '#4a9e6b', border: '1px solid rgba(74,158,107,0.3)' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(74,158,107,0.12)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0" style={{ border: '1px solid rgba(74,158,107,0.3)' }}/>
              : <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(74,158,107,0.2)', border: '1px solid rgba(74,158,107,0.3)' }}>
                  <span className="text-xs font-bold" style={{ color: '#4a9e6b' }}>{safeName[0]?.toUpperCase()}</span>
                </div>
            }
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate leading-tight">{safeName}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(232,245,238,0.35)' }}>GIGF Analyst</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-2 text-xs transition-colors duration-150"
            style={{ color: 'rgba(232,245,238,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(232,245,238,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,245,238,0.3)'}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: '#0a1f0f', borderBottom: '1px solid rgba(74,158,107,0.12)' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: 'rgba(232,245,238,0.5)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span className="text-white text-sm font-bold">GIGF Intel</span>
          <div className="w-8"/>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-7 w-full max-w-[1500px] mx-auto">

            <div className={tab === 'dashboard' ? '' : 'hidden'}>
              {showBriefing
                ? <LoginDashboard user={user} apiKey={apiKey} tvKey={tvKey} slackHook={slackHook} deals={deals} calendarEvents={[]} onNavigate={setTab} onDismiss={() => setShowBriefing(false)}/>
                : <div className="rounded-xl p-5 flex items-center justify-between"
                    style={{ background: 'rgba(15,45,23,0.6)', border: '1px solid rgba(74,158,107,0.15)' }}>
                    <div>
                      <p className="text-white font-semibold">Daily Impact Briefing</p>
                      <p className="text-sm mt-0.5" style={{ color: 'rgba(232,245,238,0.4)' }}>Reopen your AI-powered morning brief</p>
                    </div>
                    <button onClick={() => setShowBriefing(true)}
                      className="rounded-xl px-4 py-2 font-bold text-sm transition-colors"
                      style={{ background: '#4a9e6b', color: '#0a1f0f' }}>
                      Reopen
                    </button>
                  </div>
              }
            </div>

            <div className={tab === 'screener'  ? '' : 'hidden'}><Screener user={user} apiKey={apiKey} tvKey={tvKey} slackHook={slackHook} deals={deals} refreshDeals={refreshDeals} initialCompany={initCompany} onClearInitial={() => setInitCompany('')}/></div>
            <div className={tab === 'inbox'     ? '' : 'hidden'}><InboxScanner user={user} apiKey={apiKey} gmailToken={gmailToken} setGmailToken={setGmailToken} deals={deals} refreshDeals={refreshDeals}/></div>
            <div className={tab === 'radar'     ? '' : 'hidden'}><NewsRadar apiKey={apiKey} tvKey={tvKey}/></div>
            <div className={tab === 'intel'     ? '' : 'hidden'}><IntelligenceEngine apiKey={apiKey} tavilyKey={tvKey} deals={deals}/></div>
            <div className={tab === 'portfolio' ? '' : 'hidden'}><Portfolio apiKey={apiKey} tvKey={tvKey}/></div>
            <div className={tab === 'tracker'   ? '' : 'hidden'}><Tracker user={user} deals={deals} refreshDeals={refreshDeals} slackHook={slackHook}/></div>
            <div className={tab === 'calendar'  ? '' : 'hidden'}><Calendar apiKey={apiKey} gmailToken={gmailToken} setGmailToken={setGmailToken} deals={deals}/></div>
            <div className={tab === 'assistant' ? '' : 'hidden'}><Assistant apiKey={apiKey} deals={deals}/></div>
            <div className={tab === 'portcoai'  ? '' : 'hidden'}><PortcoAI apiKey={apiKey} tvKey={tvKey}/></div>
            <div className={tab === 'ops'       ? '' : 'hidden'}><Operations apiKey={apiKey} tvKey={tvKey} slackHook={slackHook} onSetApiKey={onSetApiKey} onSetTvKey={onSetTvKey} onSetSlackHook={onSetSlackHook}/></div>

          </div>
        </main>
      </div>
    </div>
  )
}
