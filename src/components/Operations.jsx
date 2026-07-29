import { useState } from 'react'
import { Card, Label } from './UI'

export default function Operations({ apiKey = '', tvKey = '', slackHook = '', onSetApiKey, onSetTvKey, onSetSlackHook }) {
  const [localApi,   setLocalApi]   = useState(apiKey)
  const [localTv,    setLocalTv]    = useState(tvKey)
  const [localSlack, setLocalSlack] = useState(slackHook)
  const [showApi,  setShowApi]  = useState(false)
  const [showTv,   setShowTv]   = useState(false)
  const [apiSaved,   setApiSaved]   = useState(false)
  const [tvSaved,    setTvSaved]    = useState(false)
  const [slackSaved, setSlackSaved] = useState(false)

  const saveApi   = () => { onSetApiKey?.(localApi);     setApiSaved(true);   setTimeout(() => setApiSaved(false), 2000) }
  const saveTv    = () => { onSetTvKey?.(localTv);       setTvSaved(true);    setTimeout(() => setTvSaved(false), 2000) }
  const saveSlack = () => { onSetSlackHook?.(localSlack); setSlackSaved(true); setTimeout(() => setSlackSaved(false), 2000) }

  const KeyField = ({ label, hint, link, linkLabel, value, onChange, placeholder, show, onShow, onSave, saved }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-semibold">{label}</p>
          <p className="text-white/40 text-xs mt-0.5">{hint} <a href={link} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">{linkLabel}</a></p>
        </div>
        {value && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/25">Active</span>}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input type={show ? 'text' : 'password'} value={onChange ? value : undefined}
            defaultValue={!onChange ? value : undefined}
            onChange={e => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-navy-3 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:border-gold focus:outline-none transition-colors pr-12 placeholder:text-white/20"/>
          {onShow && (
            <button onClick={() => onShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 hover:text-white/60">
              {show ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
        <button onClick={onSave}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold flex-shrink-0 transition-all ${saved ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-gold text-navy hover:bg-gold-2'}`}>
          {saved ? '✓' : 'Save'}
        </button>
      </div>
    </div>
  )

  const status = [
    { label: 'Claude API',    active: !!apiKey,   desc: 'Screener, Inbox, Calendar, Assistant, Intel' },
    { label: 'Tavily Search', active: !!tvKey,     desc: 'Radar news feed, Intel Engine deal alerts' },
    { label: 'Slack Alerts',  active: !!slackHook, desc: 'Notifies #bf-signals on high-score deals' },
    { label: 'Firebase Auth', active: true,        desc: 'Google OAuth — always active' },
    { label: 'Firestore',     active: true,        desc: 'Deal pipeline storage — always active' },
    { label: 'Gmail API',     active: true,        desc: 'Connect in Inbox tab' },
    { label: 'Calendar API',  active: true,        desc: 'Connect in Calendar tab' },
  ]

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Label>Configuration</Label>
        <h2 className="text-2xl font-bold text-white mt-2">Settings & Integrations</h2>
        <p className="text-white/40 text-sm mt-1">Keys stored in your browser only — never sent to any server except their respective APIs.</p>
      </div>

      {/* ── API Keys ── */}
      <Card className="p-5 space-y-5">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-gold">API Keys</p>
        <KeyField label="Claude API Key" hint="Get at" link="https://console.anthropic.com" linkLabel="console.anthropic.com"
          value={localApi} onChange={setLocalApi} placeholder="sk-ant-api03-..." show={showApi} onShow={setShowApi} onSave={saveApi} saved={apiSaved}/>
        <div className="h-px bg-white/8"/>
        <KeyField label="Tavily API Key" hint="Free tier at" link="https://app.tavily.com" linkLabel="app.tavily.com"
          value={localTv} onChange={setLocalTv} placeholder="tvly-..." show={showTv} onShow={setShowTv} onSave={saveTv} saved={tvSaved}/>
      </Card>

      {/* ── Slack Integration ── */}
      <Card className="p-5 space-y-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-gold mb-1">Slack Integration</p>
          <p className="text-white/40 text-xs">Auto-posts deal alerts to your Slack channel when a high-score deal is screened (≥70) or moved to IC Review.</p>
        </div>
        <div className="bg-navy-3 border border-white/8 rounded-xl p-4 space-y-2">
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30">Setup (2 min)</p>
          {['1. Go to api.slack.com/apps → Create App → Incoming Webhooks',
            '2. Activate → Add to Workspace → Choose #bf-signals channel',
            '3. Copy the Webhook URL and paste below'].map(s => (
            <p key={s} className="text-xs text-white/50">{s}</p>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-white text-sm font-semibold">Slack Webhook URL</p>
            {slackHook && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/25">Active</span>}
          </div>
          <div className="flex gap-2">
            <input type="text" value={localSlack} onChange={e => setLocalSlack(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="flex-1 bg-navy-3 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"/>
            <button onClick={saveSlack}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold flex-shrink-0 transition-all ${slackSaved ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-gold text-navy hover:bg-gold-2'}`}>
              {slackSaved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </div>
        {/* Test alert */}
        {slackHook && (
          <button onClick={async () => {
            try {
              await fetch(slackHook, { method: 'POST', body: JSON.stringify({ text: '⚡ *GIGF Intelligence* connected to Slack! Deal alerts will appear here.' }), headers: { 'Content-Type': 'application/json' } })
              alert('Test alert sent!')
            } catch { alert('Failed — check webhook URL') }
          }} className="text-xs text-gold hover:underline">
            Send test alert →
          </button>
        )}
      </Card>

      {/* ── V2 Next Integrations (Coming) ── */}
      <Card className="p-5">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-gold mb-4">V2 Next — Integrations</p>
        {[
          { label: 'Gmail Auto-Screen', status: 'PARTIAL', desc: 'Pitches in inbox → one-click Screen Now already works. Full auto-trigger coming.' },
          { label: 'Notion CRM Sync',   status: 'PLANNED', desc: 'Deal cards auto-created in Notion when saved to pipeline.' },
          { label: 'Slack Alerts',      status: slackHook ? 'ACTIVE' : 'READY', desc: 'Configure webhook above to activate.' },
          { label: 'Calendar IC Prep',  status: 'PARTIAL', desc: 'Calendar tab has AI prep for meetings. Auto-trigger on IC Review coming.' },
          { label: 'Affinity CRM',      status: 'PLANNED', desc: 'Relationship graph sync via Affinity API.' },
        ].map(({ label, status, desc }) => {
          const col = status === 'ACTIVE' ? 'text-green-400 bg-green-500/10 border-green-500/25'
            : status === 'READY' ? 'text-gold bg-gold/10 border-gold/25'
            : status === 'PARTIAL' ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
            : 'text-white/30 bg-white/5 border-white/15'
          return (
            <div key={label} className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border flex-shrink-0 mt-0.5 ${col}`}>{status}</span>
              <div>
                <p className="text-white text-sm font-semibold">{label}</p>
                <p className="text-white/35 text-xs">{desc}</p>
              </div>
            </div>
          )
        })}
      </Card>


      {/* ── V2 Next ── */}
      <Card className="p-5">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-gold mb-4">V2 Next — Integrations</p>
        {[
          { label: 'Gmail Auto-Screen', status: 'PARTIAL', desc: 'Pitches in inbox → Screen Now works. Full auto-trigger coming.' },
          { label: 'Notion CRM Sync',   status: 'PLANNED', desc: 'Deal cards auto-created in Notion when saved to pipeline.' },
          { label: 'Slack Alerts',      status: slackHook ? 'ACTIVE' : 'READY', desc: 'Configure webhook above to activate.' },
          { label: 'Calendar IC Prep',  status: 'PARTIAL', desc: 'AI prep for meetings. Auto-trigger on IC Review coming.' },
          { label: 'Affinity CRM',      status: 'PLANNED', desc: 'Relationship graph sync via Affinity API.' },
        ].map(({ label, status, desc }) => {
          const col = status === 'ACTIVE' ? 'text-green-400 bg-green-500/10 border-green-500/25'
            : status === 'READY' ? 'text-gold bg-gold/10 border-gold/25'
            : status === 'PARTIAL' ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
            : 'text-white/30 bg-white/5 border-white/15'
          return (
            <div key={label} className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border flex-shrink-0 mt-0.5 ${col}`}>{status}</span>
              <div><p className="text-white text-sm font-semibold">{label}</p><p className="text-white/35 text-xs">{desc}</p></div>
            </div>
          )
        })}
      </Card>

      {/* ── Status ── */}
      <Card className="p-5">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-gold mb-4">System Status</p>
        <div className="space-y-0">
          {status.map(({ label, active, desc }) => (
            <div key={label} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-green-400' : 'bg-red-400'}`}/>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-white/35 text-xs">{desc}</p>
              </div>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border flex-shrink-0 ${active ? 'bg-green-500/15 text-green-400 border-green-500/25' : 'bg-red-500/15 text-red-400 border-red-500/25'}`}>
                {active ? 'Active' : 'Not Set'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold text-white mb-0.5">
          Built by <a href="https://linkedin.com/in/pawan-kumar-iiitg" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Pawan Kumar</a>
        </p>
        <p className="text-xs text-white/35">EDHEC MiM Finance (Grande École) · Co-Founder & CTO, Alliance Infosys (€100K MRR) · Co-Founder, Vanivert AI · CFA Level 1 Candidate</p>
      </Card>
    </div>
  )
}
