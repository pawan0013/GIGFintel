import { signInWithGoogle } from '../firebase'
import { useState } from 'react'

// Animated leaf SVG
function LeafParticle({ style }) {
  return (
    <svg style={style} viewBox="0 0 40 40" fill="none" className="absolute opacity-10 animate-float">
      <path d="M20 2 C20 2 35 10 35 22 C35 32 27 38 20 38 C13 38 5 32 5 22 C5 10 20 2 20 2Z" fill="#4a9e6b"/>
      <path d="M20 38 L20 15" stroke="#2d5a3d" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true); setError('')
    try { await signInWithGoogle() }
    catch (e) { setError(e.message); setLoading(false) }
  }

  const particles = [
    { top:'8%',  left:'5%',  width:28, animationDelay:'0s',   animationDuration:'4s' },
    { top:'15%', right:'8%', width:20, animationDelay:'0.8s', animationDuration:'5s' },
    { top:'65%', left:'3%',  width:35, animationDelay:'1.5s', animationDuration:'3.5s' },
    { top:'75%', right:'5%', width:24, animationDelay:'0.3s', animationDuration:'4.5s' },
    { top:'40%', left:'92%', width:18, animationDelay:'2s',   animationDuration:'6s' },
    { top:'90%', left:'20%', width:22, animationDelay:'1s',   animationDuration:'4s' },
    { top:'30%', left:'88%', width:16, animationDelay:'2.5s', animationDuration:'5s' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 100% 80% at 30% 110%, rgba(45,90,61,0.4) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 70% -10%, rgba(74,158,107,0.12) 0%, transparent 50%), #0a1f0f' }}>

      {/* Animated leaf particles */}
      {particles.map((p, i) => (
        <LeafParticle key={i} style={{ position:'absolute', width:p.width, top:p.top, left:p.left, right:p.right, animationDelay:p.animationDelay, animationDuration:p.animationDuration }}/>
      ))}

      {/* Background forest silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-48 opacity-[0.04]" style={{
        background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1440 200\'%3E%3Cpath fill=\'%234a9e6b\' d=\'M0 200 L0 100 L60 60 L80 90 L120 40 L150 80 L200 30 L240 70 L280 20 L320 65 L360 15 L400 60 L440 25 L480 70 L520 10 L560 55 L600 20 L640 65 L680 15 L720 60 L760 25 L800 70 L840 20 L880 65 L920 30 L960 75 L1000 25 L1040 70 L1080 30 L1120 80 L1160 40 L1200 90 L1240 50 L1280 100 L1320 60 L1360 110 L1400 70 L1440 120 L1440 200Z\'/%3E%3C/svg%3E") no-repeat bottom center / cover'
      }}/>

      <div className="w-full max-w-md relative z-10">
        {/* Logo mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 relative"
            style={{ background: 'linear-gradient(135deg, rgba(74,158,107,0.2) 0%, rgba(45,90,61,0.3) 100%)', border: '1px solid rgba(74,158,107,0.3)' }}>
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <path d="M16 3 C16 3 28 9 28 18 C28 25.7 22.6 30 16 30 C9.4 30 4 25.7 4 18 C4 9 16 3 16 3Z" fill="rgba(74,158,107,0.3)" stroke="#4a9e6b" strokeWidth="1.5"/>
              <path d="M16 30 L16 12" stroke="#4a9e6b" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M16 20 C16 20 10 16 8 12" stroke="#4a9e6b" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
              <path d="M16 22 C16 22 22 18 24 14" stroke="#4a9e6b" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
            </svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-leaf-DEFAULT animate-pulse"
              style={{ boxShadow: '0 0 8px rgba(74,158,107,0.6)' }}/>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4"
            style={{ background: 'rgba(74,158,107,0.1)', border: '1px solid rgba(74,158,107,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-leaf-DEFAULT animate-pulse"/>
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: '#4a9e6b' }}>GIGF Intelligence v1.0</span>
          </div>

          <h1 className="text-3xl font-bold mb-1" style={{ color: '#e8f5ee' }}>
            Meridiam <span style={{ color: '#4a9e6b' }}>GIGF</span>
          </h1>
          <p className="text-sm" style={{ color: 'rgba(232,245,238,0.45)' }}>Green Impact Growth Fund · AI Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: 'rgba(15,45,23,0.8)', border: '1px solid rgba(74,158,107,0.15)', backdropFilter: 'blur(12px)' }}>

          <div className="space-y-3 mb-8">
            {[
              '🌱  Impact screener calibrated to GIGF thesis & 4 criteria',
              '🌿  Article 9 SFDR + tCO2eq scoring on every deal',
              '📊  IC memo with AI vs human judgment appendix',
              '🌍  EU ecological transition radar — 8 live sources',
              '🔋  Portfolio monitoring: Chargepoly, iwell, Oxand + more',
            ].map(f => (
              <div key={f} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(232,245,238,0.55)' }}>
                <span>{f}</span>
              </div>
            ))}
          </div>

          <button onClick={handleLogin} disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 rounded-xl py-3.5 px-6 font-semibold text-sm hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait">
            {loading
              ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/>
              : <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
            }
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {error && <p className="mt-3 text-red-400 text-xs text-center">{error}</p>}
          <p className="mt-4 text-xs text-center" style={{ color: 'rgba(232,245,238,0.25)' }}>
            Your data is private and stored only under your account.
          </p>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(232,245,238,0.2)' }}>
          Built for Meridiam GIGF by Pawan Kumar, EDHEC MiM Finance
        </p>
      </div>
    </div>
  )
}
