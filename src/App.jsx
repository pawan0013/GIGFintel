import { useState, useEffect, useCallback } from 'react'
import { auth, getDeals } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

export default function App() {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [deals, setDeals]       = useState([])
  const [gmailToken, setGmailToken] = useState(null)
  const [apiKey, setApiKey]     = useState(() => localStorage.getItem('gigf-api-key') || '')
  const [tvKey, setTvKey]       = useState(() => localStorage.getItem('gigf-tv-key')  || '')
  const [slackHook, setSlackHook] = useState(() => localStorage.getItem('gigf-slack-hook') || '')

  const refreshDeals = useCallback(async (uid) => {
    if (!uid) return
    try { const d = await getDeals(uid); setDeals(Array.isArray(d) ? d : []) }
    catch (e) { console.error('getDeals:', e); setDeals([]) }
  }, [])

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u); setLoading(false)
    if (u) refreshDeals(u.uid)
  }), [refreshDeals])

  const handleSetApiKey    = (k) => { setApiKey(k);    localStorage.setItem('gigf-api-key', k) }
  const handleSetTvKey     = (k) => { setTvKey(k);     localStorage.setItem('gigf-tv-key', k)  }
  const handleSetSlackHook = (k) => { setSlackHook(k); localStorage.setItem('gigf-slack-hook', k) }
  const handleLogout = () => { auth.signOut(); setDeals([]); setGmailToken(null) }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1f0f' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#4a9e6b transparent #4a9e6b #4a9e6b' }}/>
        <p className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: '#4a9e6b' }}>Initializing GIGF Intel</p>
      </div>
    </div>
  )

  return user
    ? <Dashboard
        user={user} apiKey={apiKey} tvKey={tvKey}
        gmailToken={gmailToken} setGmailToken={setGmailToken}
        slackHook={slackHook}
        deals={deals} refreshDeals={() => refreshDeals(user.uid)}
        onSetApiKey={handleSetApiKey} onSetTvKey={handleSetTvKey}
        onSetSlackHook={handleSetSlackHook}
        onLogout={handleLogout}
      />
    : <Login />
}
