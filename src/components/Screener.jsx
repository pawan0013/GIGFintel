import { useState, useCallback, useEffect } from 'react'
import { claudeAPI, parseJSON, tavily, MEMO_SYSTEM, enrichCompany, PORTFOLIO_NAMES, PORTFOLIO } from '../api'
import { saveDeal, getSimilarDeals, updateDealStatus } from '../firebase'
import { Badge, Pill, Card, Label, SectionLabel, Empty, ConfidenceFlag, Button } from './UI'
import MemoPresent from './MemoPresent'

// ─── Export: PDF ──────────────────────────────────────────────────────────────
function exportPDF(m) {
  const col = m.thesis_fit_score >= 70 ? '#166534' : m.thesis_fit_score >= 45 ? '#92400e' : '#991b1b'
  const w = window.open('', '_blank')
  w.document.write(`<!DOCTYPE html><html><head><title>${m.company} — GIGF IC Memo</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 820px; margin: 0 auto; padding: 2.5rem; font-size: 12px; line-height: 1.65; color: #1a1a1a; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-35deg); font-size: 52px; font-weight: 900; color: rgba(8,18,42,0.045); white-space: nowrap; pointer-events: none; z-index: 0; letter-spacing: .08em; font-family: 'Segoe UI'; }
    .watermark-sub { position: fixed; top: calc(50% + 48px); left: 50%; transform: translate(-50%,-50%) rotate(-35deg); font-size: 16px; font-weight: 700; color: rgba(8,18,42,0.04); white-space: nowrap; pointer-events: none; z-index: 0; letter-spacing: .15em; }
    content { position: relative; z-index: 1; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #08122a; }
    .logo-bar { display: flex; align-items: center; gap: .5rem; margin-bottom: .5rem; }
    .logo-text { font-size: 9px; font-weight: 700; color: #c9a050; letter-spacing: .15em; text-transform: uppercase; }
    h1 { font-size: 26px; font-weight: 800; margin: 0 0 .25rem; color: #08122a; }
    h2 { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #666; margin: 1.2rem 0 .5rem; border-bottom: 1px solid #e5e5e5; padding-bottom: .2rem; }
    .score { font-size: 36px; font-weight: 800; color: ${col}; font-family: monospace; }
    .rec { display: inline-block; padding: .2rem .6rem; border-radius: 4px; font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; background: ${m.recommendation === 'INVEST' ? '#dcfce7' : m.recommendation === 'PASS' ? '#fee2e2' : '#fef9c3'}; color: ${m.recommendation === 'INVEST' ? '#166534' : m.recommendation === 'PASS' ? '#991b1b' : '#713f12'}; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .5rem; }
    .kv { background: #f8f8f8; border-radius: 6px; padding: .6rem; }
    .kk { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #888; }
    .vv { font-weight: 700; font-size: 13px; margin-top: .15rem; }
    .score-row { display: flex; align-items: center; gap: .5rem; margin-bottom: .4rem; }
    .score-bar { flex: 1; height: 6px; background: #e5e5e5; border-radius: 3px; }
    .score-fill { height: 100%; border-radius: 3px; background: #c9a050; }
    .red-flag { color: #991b1b; margin-bottom: .2rem; }
    .partner-q { padding: .3rem 0; border-bottom: 1px solid #f0f0f0; }
    .q-num { font-weight: 700; color: #c9a050; margin-right: .4rem; }
    .confidential { position: fixed; bottom: 1rem; right: 1rem; font-size: 8px; color: #aaa; letter-spacing: .1em; text-transform: uppercase; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e5e5; font-size: 9px; color: #999; display: flex; justify-content: space-between; }
    @media print { button { display: none } }
  </style></head><body>`)
  w.document.write('<div class="watermark">MERIDIAM GIGF</div><div class="watermark-sub">CONFIDENTIAL</div>')
  w.document.write(`
    <div class="header">
      <div>
        <div class="logo-bar"><div class="logo-text">⚡ GIGF Intelligence · IC Investment Memo</div></div>
        <h1>${m.company}</h1>
        <p style="color:#555;margin:.2rem 0">${m.tagline || ''}</p>
        <div style="display:flex;gap:.4rem;margin-top:.4rem;align-items:center">
          <span class="rec">${m.recommendation}</span>
          <span style="font-size:10px;color:#555">${m.sector || ''} · ${m.stage || ''} · ${m.geography || ''}</span>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.08em">Thesis Fit</div>
        <div class="score">${m.thesis_fit_score}/100</div>
        <div style="font-size:10px;color:#555">Confidence: ${m.confidence_level || 'Medium'}</div>
      </div>
    </div>

    <h2>Executive Summary</h2>
    <p>${m.executive_summary || ''}</p>
    <p><strong>Recommendation:</strong> ${m.recommendation_rationale || ''}</p>

    <h2>Scoring Breakdown</h2>
    ${['founders','regulatory_moat','scalability','unit_economics'].map(k => {
      const b = m.scoring_breakdown?.[k] || {score:0,max:25,note:''}
      return `<div class="score-row"><span style="width:110px;font-size:10px;color:#555;text-transform:capitalize">${k.replace(/_/g,' ')}</span><div class="score-bar"><div class="score-fill" style="width:${(b.score/b.max*100).toFixed(0)}%"></div></div><span style="font-size:11px;font-weight:700;width:32px;text-align:right">${b.score}/${b.max}</span><span style="font-size:10px;color:#888;flex:1;padding-left:.5rem">${b.note||''}</span></div>`
    }).join('')}

    <h2>Market</h2>
    <div class="grid3">
      <div class="kv"><div class="kk">TAM</div><div class="vv">${m.market?.tam||'—'}</div></div>
      <div class="kv"><div class="kk">SAM</div><div class="vv">${m.market?.sam||'—'}</div></div>
      <div class="kv"><div class="kk">SOM</div><div class="vv">${m.market?.som||'—'}</div></div>
    </div>
    <p><strong>Tailwind:</strong> ${m.market?.key_tailwind||''}</p>

    <h2>Product & Moat</h2>
    <p>${m.product?.what_it_does||''}</p>
    <p><strong>Moat:</strong> ${m.product?.moat||''}</p>
    <p><strong>vs Competitors:</strong> ${m.product?.vs_competitors||''}</p>

    <h2>Team</h2>
    <p>${m.team?.assessment||''} — Founder-Market Fit: <strong>${m.team?.founder_market_fit||''}</strong></p>
    ${m.team?.key_gaps ? `<p><em>Gaps: ${m.team.key_gaps}</em></p>` : ''}

    <h2>Red Flags</h2>
    ${(m.red_flags||[]).map(f => `<p class="red-flag">⚑ ${f}</p>`).join('')}

    <h2>Key Challenges</h2>
    ${(m.challenges||[]).map(c => `<p>• <strong>${c.challenge||c}</strong>${c.timeline ? ` — ${c.timeline}` : ''}${c.impact ? ` (Impact: ${c.impact})` : ''}</p>`).join('')}

    <h2>Risks</h2>
    ${(m.risks||[]).map(r => `<p><strong>[${r.severity||''}]</strong> ${r.description||''} — ${r.mitigant||''}</p>`).join('')}

    <h2>Partner Questions — IC (Alexandre Derreumaux)</h2>
    ${(m.partner_questions||[]).map((q,i) => `<div class="partner-q"><span class="q-num">Q${i+1}</span>${q}</div>`).join('')}

    <h2>Power Law Investment Case</h2>
    <p>${m.power_law_case||''}</p>

    <h2>Portfolio Adjacency</h2>
    <p>${m.portfolio_adjacency||''}</p>

    <h2>Comparable Transactions</h2>
    ${(m.comparables||[]).map(c => `<p><strong>${c.company||''}</strong> ${c.round||''} — ${c.relevance||''}</p>`).join('')}

    <h2>Diligence Questions</h2>
    ${(m.diligence_questions||[]).map((q,i) => `<p><strong>Q${i+1}:</strong> ${q}</p>`).join('')}

    <div class="footer">
      <span>⚡ GIGF Intelligence v1 · AI-assisted, human-reviewed</span>
      <span>${new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</span>
    </div>
    <div class="confidential">CONFIDENTIAL — MERIDIAM GIGF</div>
    <script>window.onload=()=>window.print()<\/script>
  </body></html>`)
  w.document.close()
}


// ─── Export: Word (.doc) ──────────────────────────────────────────────────────
function exportWord(m) {
  const col = m.thesis_fit_score >= 70 ? '#166534' : m.thesis_fit_score >= 45 ? '#92400e' : '#991b1b'
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head>
    <meta charset="UTF-8"><title>${m.company} - GIGF IC Memo</title>
    <style>
      body{font-family:Calibri,Arial,sans-serif;font-size:11pt;margin:2.5cm}
      .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:60pt;font-weight:900;color:rgba(8,18,42,0.04);white-space:nowrap;pointer-events:none;letter-spacing:.1em}
      .confidential-footer{margin-top:20pt;padding-top:6pt;border-top:1pt solid #ddd;font-size:8pt;color:#aaa;text-align:center;letter-spacing:.1em;text-transform:uppercase}
      h1{font-size:20pt;color:#08122a;margin-bottom:4pt}
      h2{font-size:10pt;font-weight:bold;color:#08122a;border-bottom:1pt solid #c9a050;padding-bottom:2pt;margin-top:14pt;margin-bottom:6pt;text-transform:uppercase;letter-spacing:.05em}
      .score{font-size:28pt;font-weight:bold;color:${col};font-family:Courier New}
      .tagline{font-size:10pt;color:#666;margin:2pt 0 8pt}
      .rec{font-weight:bold;text-transform:uppercase;color:${m.recommendation==='INVEST'?'#166534':m.recommendation==='PASS'?'#991b1b':'#713f12'}}
      table{border-collapse:collapse;width:100%;margin:6pt 0}
      td,th{border:1pt solid #ddd;padding:4pt 6pt;font-size:10pt}
      th{background:#08122a;color:white;font-weight:bold;text-align:left}
      .flag{color:#991b1b;font-weight:bold}
      .dim-row{margin:3pt 0}
      p{margin:4pt 0;font-size:11pt;line-height:1.5}
      .footer{margin-top:20pt;padding-top:6pt;border-top:1pt solid #ddd;font-size:9pt;color:#888}
    </style></head><body>
    <div class="watermark">MERIDIAM GIGF</div>
    <p style="font-size:8pt;color:#c9a050;font-weight:bold;letter-spacing:.15em;text-transform:uppercase">GIGF Intelligence · Investment Committee Memo · CONFIDENTIAL</p>
    <h1>${m.company}</h1>
    <p class="tagline">${m.tagline||''}</p>
    <p><span class="rec">${m.recommendation}</span> &nbsp;·&nbsp; ${m.sector||''} &nbsp;·&nbsp; ${m.stage||''} &nbsp;·&nbsp; ${m.geography||''}</p>
    <p class="score">${m.thesis_fit_score}/100</p>
    <p><em>Confidence: ${m.confidence_level||'Medium'}${m.confidence_note?` — ${m.confidence_note}`:''}</em></p>

    <h2>Executive Summary</h2>
    <p>${m.executive_summary||''}</p>
    <p><strong>Recommendation:</strong> ${m.recommendation_rationale||''}</p>

    <h2>Scoring Breakdown</h2>
    <table><tr><th>Dimension</th><th>Score</th><th>Assessment</th></tr>
    ${['founders','regulatory_moat','scalability','unit_economics'].map(k=>{
      const b=m.scoring_breakdown?.[k]||{score:0,max:25,note:''}
      return `<tr><td style="text-transform:capitalize">${k.replace(/_/g,' ')}</td><td><strong>${b.score}/${b.max}</strong></td><td>${b.note||''}</td></tr>`
    }).join('')}</table>

    <h2>Market Opportunity</h2>
    <table><tr><th>TAM</th><th>SAM</th><th>SOM</th></tr>
    <tr><td>${m.market?.tam||'—'}</td><td>${m.market?.sam||'—'}</td><td>${m.market?.som||'—'}</td></tr></table>
    <p><strong>Key Tailwind:</strong> ${m.market?.key_tailwind||''}</p>

    <h2>Product & Competitive Moat</h2>
    <p>${m.product?.what_it_does||''}</p>
    <p><strong>Moat:</strong> ${m.product?.moat||''}</p>
    <p><strong>vs Competitors:</strong> ${m.product?.vs_competitors||''}</p>

    <h2>Team Assessment</h2>
    <p>${m.team?.assessment||''}</p>
    <p><strong>Founder-Market Fit:</strong> ${m.team?.founder_market_fit||''}</p>
    ${m.team?.key_gaps?`<p><strong>Gaps:</strong> ${m.team.key_gaps}</p>`:''}

    <h2>Red Flags</h2>
    ${(m.red_flags||[]).map(f=>`<p class="flag">⚑ ${f}</p>`).join('')}

    <h2>Key Challenges</h2>
    <table><tr><th>Challenge</th><th>Timeline</th><th>Impact</th></tr>
    ${(m.challenges||[]).map(c=>`<tr><td>${c.challenge||c}</td><td>${c.timeline||'—'}</td><td>${c.impact||'—'}</td></tr>`).join('')}</table>

    <h2>Risk Register</h2>
    <table><tr><th>Risk</th><th>Severity</th><th>Mitigant</th></tr>
    ${(m.risks||[]).map(r=>`<tr><td>${r.description||''}</td><td><strong>${r.severity||''}</strong></td><td>${r.mitigant||''}</td></tr>`).join('')}</table>

    <h2>Partner Questions — IC Preparation (Julien Creuze)</h2>
    ${(m.partner_questions||[]).map((q,i)=>`<p><strong>Q${i+1}.</strong> ${q}</p>`).join('')}

    <h2>Power Law Investment Case</h2>
    <p>${m.power_law_case||''}</p>

    <h2>Portfolio Adjacency</h2>
    <p>${m.portfolio_adjacency||''}</p>

    <h2>Comparables</h2>
    <table><tr><th>Company</th><th>Round</th><th>Relevance</th></tr>
    ${(m.comparables||[]).map(c=>`<tr><td><strong>${c.company||''}</strong></td><td>${c.round||''}</td><td>${c.relevance||''}</td></tr>`).join('')}</table>

    <h2>Diligence Questions</h2>
    ${(m.diligence_questions||[]).map((q,i)=>`<p><strong>Q${i+1}.</strong> ${q}</p>`).join('')}

    <div class="footer">
      GIGF Intelligence v1 · AI-assisted, human-reviewed · CONFIDENTIAL · ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}
    </div>
  </body></html>`
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${m.company.replace(/\s+/g,'_')}_GIGF_IC_Memo.doc`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Export: PowerPoint (.pptx) ───────────────────────────────────────────────
async function exportPPTX(m) {
  const { default: pptxgen } = await import('pptxgenjs')

  // EXACT template colors from XML analysis
  const BG_DARK='162F28', BG_CREAM='F7F9F8', BG_MID='D7E2DD'
  const TEAL='5ECCB5', TEAL_DIM='3FA88F', TEAL_DARK='122E26'
  const TXT_DARK='162F28', TXT_MED='1F2A24', TXT_GREY='8C9994', TXT_WHITE='FFFFFF'
  const RED='E05252'
  const ff='Plus Jakarta Sans'

  const score   = m.thesis_fit_score || 75
  const recText = m.recommendation   || 'INVEST'
  const conf    = (m.confidence_level||'MEDIUM').toUpperCase()
  const today   = new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})

  // ── HELPERS ──────────────────────────────────────────────────────
  // Watermark: centered on 10" slide, properly positioned
  const wm = (s) => {
    s.addText('Meridiam GIGF', {
      x:0, y:1.5, w:10, h:2.5,
      fontSize:100, bold:true, color:TEAL, transparency:90,
      align:'center', valign:'middle', fontFace:ff
    })
  }

  const hdr = (s, sec, title) => {
    s.addShape('RECTANGLE',{x:0,y:0,w:10,h:0.219,fill:{color:TXT_WHITE},line:{color:TXT_WHITE}})
    s.addText(sec,{x:0.375,y:0.047,w:8.4,h:0.164,fontSize:7,color:TXT_DARK,charSpacing:1,fontFace:ff})
    s.addShape('OVAL',{x:8.812,y:0.219,w:0.25,h:0.25,fill:{color:TEAL},line:{color:TEAL}})
    s.addText('M',{x:8.812,y:0.219,w:0.25,h:0.25,fontSize:12,bold:true,color:TXT_WHITE,align:'center',valign:'middle',fontFace:ff})
    s.addText('Meridiam',{x:9.085,y:0.229,w:0.78,h:0.22,fontSize:8,bold:true,color:TXT_DARK,fontFace:ff})
    s.addShape('LINE',{x:0,y:0.215,w:10,h:0,line:{color:BG_MID,width:0.75}})
    s.addText(sec,{x:0.375,y:0.246,w:9.25,h:0.18,fontSize:7,color:TEAL_DIM,charSpacing:1.5,fontFace:ff})
    s.addText(title,{x:0.375,y:0.44,w:9.25,h:0.32,fontSize:19,bold:true,color:TXT_DARK,fontFace:ff})
  }

  const ftr = (s,n,t) => {
    s.addShape('LINE',{x:0,y:5.41,w:10,h:0,line:{color:BG_MID,width:0.5}})
    s.addText('MERIDIAM GIGF · IC MEMO',{x:0.375,y:5.433,w:8.5,h:0.16,fontSize:7,color:TXT_GREY,charSpacing:1.5,fontFace:ff})
    s.addText(`${String(n).padStart(2,'0')} / ${String(t).padStart(2,'0')}`,{x:9.2,y:5.433,w:0.5,h:0.16,fontSize:7,color:TXT_GREY,align:'right',fontFace:ff})
  }

  const slbl=(s,t,x,y,w)=>s.addText(t,{x,y,w:w||4.562,h:0.15,fontSize:7.5,color:TEAL_DIM,bold:true,charSpacing:1.5,fontFace:ff})
  const lbl=(s,t,x,y,w)=>s.addText(t,{x,y,w:w||3.45,h:0.15,fontSize:7.5,color:TXT_GREY,fontFace:ff})
  const div=(s,x,y,w)=>s.addShape('LINE',{x,y,w,h:0,line:{color:BG_MID,width:0.5}})

  const prs = new pptxgen()
  prs.layout = 'LAYOUT_16x9'

  // ══════════════════════════════════════════════════════════════════
  // SLIDE 1 — COVER
  // ══════════════════════════════════════════════════════════════════
  const s1=prs.addSlide(); s1.background={color:TXT_WHITE}
  // Left dark green panel
  s1.addShape('RECTANGLE',{x:0,y:0,w:5.8,h:5.625,fill:{color:BG_DARK},line:{color:BG_DARK}})
  // Top white strip
  s1.addShape('RECTANGLE',{x:0,y:0,w:10,h:0.219,fill:{color:TXT_WHITE},line:{color:TXT_WHITE}})
  s1.addText('MERIDIAM GIGF · INVESTMENT COMMITTEE MEMO · CONFIDENTIAL',{x:3.159,y:0.055,w:6.5,h:0.15,fontSize:7.5,color:TXT_DARK,charSpacing:1,fontFace:ff})
  // M logo top right
  s1.addShape('OVAL',{x:8.812,y:0.219,w:0.25,h:0.25,fill:{color:TEAL},line:{color:TEAL}})
  s1.addText('M',{x:8.812,y:0.219,w:0.25,h:0.25,fontSize:12,bold:true,color:TXT_WHITE,align:'center',valign:'middle',fontFace:ff})
  s1.addText('Meridiam',{x:9.085,y:0.229,w:0.78,h:0.22,fontSize:8,bold:true,color:TXT_DARK,fontFace:ff})
  // Left panel content
  s1.addShape('OVAL',{x:0.375,y:1.899,w:0.5,h:0.5,fill:{color:TEAL_DARK},line:{color:TEAL_DARK}})
  s1.addText('M',{x:0.375,y:1.899,w:0.5,h:0.5,fontSize:24,bold:true,color:TEAL,align:'center',valign:'middle',fontFace:ff})
  s1.addText('Meridiam  GIGF',{x:0.984,y:1.95,w:4.441,h:0.45,fontSize:22,bold:true,color:BG_DARK,fontFace:ff})
  s1.addShape('RECTANGLE',{x:0.375,y:2.54,w:5.05,h:0.02,fill:{color:TEAL},line:{color:TEAL}})
  s1.addText('INVESTMENT COMMITTEE MEMO',{x:0.375,y:2.58,w:5.17,h:0.18,fontSize:7.5,color:BG_DARK,charSpacing:1.5,bold:true,fontFace:ff})
  s1.addText('IC Investment Memo',{x:0.375,y:2.78,w:5.05,h:0.65,fontSize:36,bold:true,color:BG_DARK,fontFace:ff})
  s1.addText('Confidential · For internal IC circulation only',{x:0.375,y:3.52,w:5.17,h:0.18,fontSize:8,color:BG_DARK,fontFace:ff})
  s1.addText('PREPARED BY · GIGF INTELLIGENCE',{x:0.375,y:4.82,w:5.17,h:0.15,fontSize:7.5,color:BG_DARK,charSpacing:1,fontFace:ff})
  s1.addText(`DATE · ${today}`,{x:0.375,y:4.98,w:5.05,h:0.15,fontSize:7.5,color:BG_DARK,fontFace:ff})
  // Right white panel
  s1.addText('PORTFOLIO SNAPSHOT',{x:6.175,y:1.183,w:3.45,h:0.18,fontSize:7.5,color:TEAL,bold:true,charSpacing:1.5,fontFace:ff})
  lbl(s1,'COMPANY',6.175,1.42,3.45)
  s1.addText(m.company||'',{x:6.175,y:1.56,w:3.45,h:0.3,fontSize:16,bold:true,color:TXT_DARK,fontFace:ff,fit:'shrink'})
  lbl(s1,'TAGLINE',6.175,1.91,3.45)
  s1.addText(m.tagline||'',{x:6.175,y:2.05,w:3.57,h:0.22,fontSize:8,color:TXT_MED,fontFace:ff,fit:'shrink'})
  lbl(s1,'SECTOR · STAGE · GEOGRAPHY',6.175,2.32,3.45)
  s1.addText([m.sector,m.stage,m.geography].filter(Boolean).join(' · '),{x:6.175,y:2.46,w:3.45,h:0.22,fontSize:7.5,color:TXT_MED,fontFace:ff,fit:'shrink'})
  lbl(s1,'RECOMMENDATION',6.175,2.72,3.45)
  s1.addShape('RECTANGLE',{x:6.175,y:2.86,w:3.45,h:0.33,fill:{color:TEAL},line:{color:TEAL}})
  s1.addText(recText,{x:6.175,y:2.86,w:3.45,h:0.33,fontSize:8,bold:true,color:TXT_DARK,align:'center',valign:'middle',fontFace:ff,fit:'shrink'})
  // Score box
  s1.addShape('RECTANGLE',{x:6.179,y:3.28,w:3.442,h:1.15,fill:{color:BG_CREAM},line:{color:BG_MID,width:0.5}})
  s1.addText('THESIS FIT',{x:6.323,y:3.38,w:3.153,h:0.15,fontSize:7.5,color:TXT_GREY,charSpacing:1.5,fontFace:ff})
  s1.addText(`${score}/100`,{x:6.323,y:3.54,w:3.153,h:0.6,fontSize:40,bold:true,color:TXT_DARK,fontFace:'Courier New',align:'center'})
  s1.addText(`CONFIDENCE: ${conf}`,{x:6.323,y:4.16,w:3.273,h:0.15,fontSize:7.5,color:TEAL_DIM,charSpacing:1,fontFace:ff})
  // SDGs if available
  if(m.impact?.sdg_alignment?.length>0){
    lbl(s1,'SDG ALIGNMENT',6.175,4.42,3.45)
    s1.addText((m.impact.sdg_alignment||[]).slice(0,3).join(' · '),{x:6.175,y:4.56,w:3.45,h:0.22,fontSize:7,color:TEAL_DIM,fontFace:ff,fit:'shrink'})
  }
  ftr(s1,1,6)

  // ══════════════════════════════════════════════════════════════════
  // SLIDE 2 — THESIS & SCORING
  // ══════════════════════════════════════════════════════════════════
  const s2=prs.addSlide(); s2.background={color:TXT_WHITE}
  wm(s2)
  hdr(s2,'SECTION 01 / 05 · THESIS & SCORING','Investment Thesis & Scoring Breakdown')

  // Top 3 meta boxes
  ;[['RECOMMENDATION',recText,0.375],['ROUND',m.stage||'—',3.5],['HOLD PERIOD','12 + 3 years',6.625]].forEach(([l,v,x])=>{
    s2.addText(l,{x,y:0.88,w:3,h:0.15,fontSize:7.5,color:TXT_GREY,charSpacing:1.5,fontFace:ff})
    s2.addText(v,{x,y:1.04,w:3,h:0.35,fontSize:11,bold:true,color:TXT_DARK,fontFace:ff,fit:'shrink'})
    div(s2,x,1.42,3)
  })
  s2.addText(m.recommendation_rationale||'',{x:0.375,y:1.46,w:9.25,h:0.28,fontSize:8,color:TXT_MED,fontFace:ff,fit:'shrink'})
  div(s2,0.375,1.76,9.25)

  // 4 scoring boxes in 2x2 grid — NO OVERLAP, fixed heights
  const dims=[
    {key:'growth_momentum',label:'Growth Momentum',num:'01',x:0.375,y:1.82},
    {key:'impact_integrity',label:'Impact Integrity',num:'02',x:5.0,y:1.82},
    {key:'team_commitment',label:'Team Commitment',num:'03',x:0.375,y:3.65},
    {key:'business_model',label:'Business Model',num:'04',x:5.0,y:3.65},
  ]
  dims.forEach(d=>{
    const b=m.scoring_breakdown?.[d.key]||{score:0,max:25,note:''}
    const pct=b.score/25
    const col=b.score>=18?TEAL:b.score>=12?'C9A84C':RED
    // Number + label row
    s2.addText(d.num,{x:d.x,y:d.y,w:0.35,h:0.22,fontSize:9,bold:true,color:TEAL_DIM,fontFace:ff})
    s2.addText(d.label,{x:d.x+0.38,y:d.y+0.02,w:2.8,h:0.18,fontSize:9,bold:true,color:TXT_DARK,fontFace:ff})
    // Score
    s2.addText(`${b.score}/25`,{x:d.x,y:d.y+0.24,w:4.5,h:0.38,fontSize:24,bold:true,color:col,fontFace:'Courier New'})
    // Progress bar
    s2.addShape('RECTANGLE',{x:d.x,y:d.y+0.65,w:4.5,h:0.07,fill:{color:BG_MID},line:{color:BG_MID}})
    if(pct>0)s2.addShape('RECTANGLE',{x:d.x,y:d.y+0.65,w:Math.max(0.1,4.5*pct),h:0.07,fill:{color:col},line:{color:col}})
    // Note — fixed height box, text shrinks to fit
    s2.addText(b.note||'',{x:d.x,y:d.y+0.76,w:4.5,h:0.72,fontSize:8,color:TXT_MED,fontFace:ff,valign:'top'})
    // Row divider
    if(d.num==='02')div(s2,0.375,3.6,9.25)
  })
  ftr(s2,2,6)

  // ══════════════════════════════════════════════════════════════════
  // SLIDE 3 — MARKET & MOAT + GLOBAL PERSPECTIVE
  // ══════════════════════════════════════════════════════════════════
  const s3=prs.addSlide(); s3.background={color:TXT_WHITE}
  wm(s3)
  hdr(s3,'SECTION 02 / 05 · MARKET & MOAT','Market Opportunity, Product Moat & Global Perspective')

  // TAM/SAM/SOM boxes
  slbl(s3,'MARKET SIZE',0.375,0.86,9.25)
  ;[['TAM',m.market?.tam||'—',0.375],['SAM',m.market?.sam||'—',3.5],['SOM',m.market?.som||'—',6.625]].forEach(([l,v,x])=>{
    s3.addShape('RECTANGLE',{x,y:1.02,w:3.0,h:0.85,fill:{color:BG_CREAM},line:{color:BG_MID,width:0.5}})
    s3.addText(l,{x:x+0.08,y:1.07,w:2.84,h:0.15,fontSize:7.5,bold:true,color:TEAL_DIM,charSpacing:2,fontFace:ff})
    s3.addText(v,{x:x+0.08,y:1.24,w:2.84,h:0.38,fontSize:16,bold:true,color:TXT_DARK,fontFace:ff,fit:'shrink'})
  })
  div(s3,0.375,1.9,9.25)

  // 3 content columns
  ;[
    ['KEY REGULATORY TAILWIND',m.market?.key_tailwind||'',0.375],
    ['PRODUCT & MODEL',m.product?.what_it_does||'',3.5],
    ['COMPETITIVE MOAT',m.product?.moat||'',6.625],
  ].forEach(([l,v,x])=>{
    s3.addText(l,{x,y:1.96,w:3.0,h:0.15,fontSize:7.5,bold:true,color:TEAL_DIM,charSpacing:1.5,fontFace:ff})
    div(s3,x,2.13,3.0)
    s3.addText(v,{x,y:2.17,w:3.0,h:1.05,fontSize:8,color:TXT_MED,fontFace:ff,valign:'top'})
  })
  div(s3,0.375,3.26,9.25)

  // Global perspective row
  slbl(s3,'GLOBAL PERSPECTIVE & OPPORTUNITIES',0.375,3.32,9.25)
  ;[
    ['GLOBAL TAILWINDS',(m.global_perspective?.tailwinds||'IEA Net Zero 2050 requires 40x EV charging capacity. US Inflation Reduction Act driving $370B clean energy investment. China BYD + CATL supply chain creating component cost deflation globally.'),0.375],
    ['GLOBAL THREATS',(m.global_perspective?.threats||'Chinese OEM market entry into European EV market. US tariff policy creating supply chain uncertainty. Rising interest rates compressing infrastructure CAPEX economics.'),3.5],
    ['GLOBAL OPPORTUNITY',(m.global_perspective?.opportunity||'North American FHWA charging corridor mandates mirror EU AFIR. ASEAN EV adoption curve 3-5 years behind Europe creates expansion window. Middle East sovereign wealth funds seeking clean infrastructure.'),6.625],
  ].forEach(([l,v,x])=>{
    s3.addText(l,{x,y:3.48,w:3.0,h:0.15,fontSize:7.5,bold:true,color:TEAL_DIM,charSpacing:1.5,fontFace:ff})
    div(s3,x,3.65,3.0)
    s3.addText(v,{x,y:3.69,w:3.0,h:1.4,fontSize:7.5,color:TXT_MED,fontFace:ff,valign:'top'})
  })
  ftr(s3,3,6)

  // ══════════════════════════════════════════════════════════════════
  // SLIDE 4 — TEAM & COMPARABLES
  // ══════════════════════════════════════════════════════════════════
  const s4=prs.addSlide(); s4.background={color:TXT_WHITE}
  wm(s4)
  hdr(s4,'SECTION 03 / 05 · TEAM & COMPS','Team Assessment & Comparable Transactions')

  // Left: Team
  slbl(s4,'TEAM ASSESSMENT',0.375,0.86)
  div(s4,0.375,1.02,4.4)
  s4.addText('FOUNDER–MARKET FIT',{x:0.375,y:1.06,w:3.0,h:0.18,fontSize:7.5,color:TXT_GREY,charSpacing:1,fontFace:ff})
  const fmfc=(m.team?.founder_market_fit||'').toLowerCase()==='high'?TEAL:'C9A84C'
  s4.addShape('RECTANGLE',{x:3.45,y:1.06,w:1.3,h:0.22,fill:{color:fmfc},line:{color:fmfc}})
  s4.addText((m.team?.founder_market_fit||'HIGH').toUpperCase(),{x:3.45,y:1.06,w:1.3,h:0.22,fontSize:8,bold:true,color:TXT_WHITE,align:'center',valign:'middle',fontFace:ff})
  s4.addText(m.team?.assessment||'',{x:0.375,y:1.32,w:4.4,h:1.0,fontSize:8,color:TXT_MED,fontFace:ff,valign:'top'})
  slbl(s4,'GAPS & RECOMMENDED DD',0.375,2.42)
  div(s4,0.375,2.58,4.4)
  ;(m.team?.key_gaps||'').split(/[.;]/).filter(g=>g.trim()).slice(0,5).forEach((gap,i)=>{
    s4.addShape('OVAL',{x:0.375,y:2.62+i*0.46,w:0.09,h:0.09,fill:{color:TEAL_DIM},line:{color:TEAL_DIM}})
    s4.addText(gap.trim(),{x:0.5,y:2.61+i*0.46,w:4.25,h:0.42,fontSize:8,color:TXT_MED,fontFace:ff,valign:'top'})
  })

  // Vertical divider
  s4.addShape('LINE',{x:4.95,y:0.86,w:0,h:4.5,line:{color:BG_MID,width:0.5}})

  // Right: Comparables 2x2
  slbl(s4,'COMPARABLE TRANSACTIONS',5.1,0.86)
  div(s4,5.1,1.02,4.65)
  const cpPos=[{x:5.1,y:1.06},{x:7.45,y:1.06},{x:5.1,y:3.1},{x:7.45,y:3.1}]
  ;(m.comparables||[]).slice(0,4).forEach((c,i)=>{
    const p=cpPos[i]
    s4.addText(`COMP ${String(i+1).padStart(2,'0')}`,{x:p.x,y:p.y,w:2.2,h:0.15,fontSize:7.5,bold:true,color:TEAL_DIM,charSpacing:1.5,fontFace:ff})
    s4.addText(c.company||'',{x:p.x,y:p.y+0.17,w:2.2,h:0.22,fontSize:9,bold:true,color:TXT_DARK,fontFace:ff,fit:'shrink'})
    s4.addText(c.round||'',{x:p.x,y:p.y+0.41,w:2.3,h:0.15,fontSize:7,color:TEAL_DIM,fontFace:ff})
    s4.addText(c.relevance||'',{x:p.x,y:p.y+0.58,w:2.2,h:1.2,fontSize:7.5,color:TXT_MED,fontFace:ff,valign:'top'})
  })
  div(s4,5.1,3.06,4.65)
  ftr(s4,4,6)

  // ══════════════════════════════════════════════════════════════════
  // SLIDE 5 — IC PREP: RED FLAGS & QUESTIONS
  // ══════════════════════════════════════════════════════════════════
  const s5=prs.addSlide(); s5.background={color:TXT_WHITE}
  wm(s5)
  hdr(s5,'SECTION 04 / 05 · RED FLAGS & QUESTIONS','IC Prep — Red Flags & Partner Questions')

  // Left: Red Flags — evenly spaced
  slbl(s5,'RED FLAGS - DEAL KILLERS',0.375,0.86)
  div(s5,0.375,1.02,4.4)
  const flags=m.red_flags||[]
  const rfH = flags.length > 3 ? 4.3/flags.length : 1.2
  flags.slice(0,5).forEach((flag,i)=>{
    const y=1.06+i*rfH
    s5.addShape('RECTANGLE',{x:0.375,y,w:0.22,h:0.22,fill:{color:RED},line:{color:RED}})
    s5.addText('!',{x:0.375,y,w:0.22,h:0.22,fontSize:9,bold:true,color:TXT_WHITE,align:'center',valign:'middle',fontFace:ff})
    s5.addText(`RED FLAG ${String(i+1).padStart(2,'0')}`,{x:4.1,y,w:0.65,h:0.15,fontSize:6,color:RED,bold:true,charSpacing:1,fontFace:ff})
    s5.addText(flag,{x:0.62,y,w:3.75,h:rfH-0.06,fontSize:7.5,color:TXT_DARK,fontFace:ff,valign:'top'})
    if(i<flags.slice(0,5).length-1)div(s5,0.375,y+rfH-0.04,4.4)
  })

  // Vertical divider
  s5.addShape('LINE',{x:4.95,y:0.86,w:0,h:4.5,line:{color:BG_MID,width:0.5}})

  // Right: Partner Questions — evenly spaced
  slbl(s5,'QUESTIONS - ALEXANDRE DERREUMAUX (IC PARTNER)',5.1,0.86,4.65)
  div(s5,5.1,1.02,4.65)
  const qs=m.partner_questions||[]
  const qH = qs.length > 3 ? 4.3/qs.length : 1.15
  qs.slice(0,5).forEach((q,i)=>{
    const y=1.06+i*qH
    s5.addShape('RECTANGLE',{x:5.1,y,w:0.28,h:0.28,fill:{color:TEAL},line:{color:TEAL}})
    s5.addText(`Q${i+1}`,{x:5.1,y,w:0.28,h:0.28,fontSize:9,bold:true,color:TXT_WHITE,align:'center',valign:'middle',fontFace:ff})
    s5.addText(q,{x:5.43,y,w:4.32,h:qH-0.06,fontSize:8,color:TXT_DARK,fontFace:ff,valign:'top'})
    if(i<qs.slice(0,5).length-1)div(s5,5.1,y+qH-0.04,4.65)
  })

  // AI appendix strip
  s5.addShape('RECTANGLE',{x:0,y:5.27,w:10,h:0.13,fill:{color:BG_MID},line:{color:BG_MID}})
  s5.addText('🤖  AI ANALYSIS APPENDIX  ·  AI-generated: research, scoring, red flags, questions  ·  Human judgment required: IC decision, valuation negotiation, board strategy, Article 9 compliance sign-off',{x:0.375,y:5.28,w:9.25,h:0.12,fontSize:5.5,color:TXT_GREY,fontFace:ff})
  ftr(s5,5,6)

  // ══════════════════════════════════════════════════════════════════
  // SLIDE 6 — INVESTMENT DECISION
  // ══════════════════════════════════════════════════════════════════
  const s6=prs.addSlide(); s6.background={color:TXT_WHITE}
  wm(s6)
  hdr(s6,'SECTION 05 / 05 · DECISION','Investment Decision')

  // Recommendation full-width box
  s6.addShape('RECTANGLE',{x:0.375,y:0.86,w:9.25,h:0.68,fill:{color:TEAL},line:{color:TEAL}})
  s6.addText('RECOMMENDATION',{x:0.55,y:0.88,w:6,h:0.15,fontSize:7.5,bold:true,color:BG_DARK,charSpacing:1.5,fontFace:ff})
  s6.addText(recText,{x:0.55,y:1.04,w:6,h:0.28,fontSize:13,bold:true,color:BG_DARK,fontFace:ff,fit:'shrink'})
  s6.addText('THESIS FIT',{x:8.5,y:0.88,w:1.0,h:0.15,fontSize:7,color:BG_DARK,charSpacing:1,fontFace:ff})
  s6.addText(`${score}/100`,{x:7.9,y:1.02,w:1.7,h:0.38,fontSize:24,bold:true,color:BG_DARK,fontFace:'Courier New'})

  // Rationale
  s6.addText(m.recommendation_rationale||'',{x:0.375,y:1.6,w:9.25,h:0.38,fontSize:8,color:TXT_MED,fontFace:ff,valign:'top',fit:'shrink'})
  div(s6,0.375,2.04,9.25)

  // Left: Power Law
  slbl(s6,'POWER LAW CASE — WHY THIS IS THE CATEGORY WINNER',0.375,2.1)
  div(s6,0.375,2.26,4.4)
  const pwLines=(m.power_law_case||'').split('. ').filter(Boolean)
  const pwH=pwLines.length>2?3.15/pwLines.slice(0,4).length:1.1
  pwLines.slice(0,4).forEach((line,i)=>{
    const y=2.3+i*pwH
    s6.addText(String(i+1),{x:0.375,y,w:0.28,h:0.22,fontSize:9,bold:true,color:TEAL_DIM,fontFace:ff})
    s6.addText(line.trim(),{x:0.68,y,w:4.1,h:pwH-0.06,fontSize:8,color:TXT_MED,fontFace:ff,valign:'top'})
    if(i<pwLines.slice(0,4).length-1)div(s6,0.375,y+pwH-0.04,4.4)
  })

  // Vertical divider
  s6.addShape('LINE',{x:4.95,y:2.1,w:0,h:3.25,line:{color:BG_MID,width:0.5}})

  // Right: Diligence Questions
  slbl(s6,'DILIGENCE QUESTIONS',5.1,2.1,4.65)
  div(s6,5.1,2.26,4.65)
  const dqs=m.diligence_questions||[]
  const dqH=dqs.length>3?3.15/dqs.slice(0,5).length:1.1
  dqs.slice(0,5).forEach((q,i)=>{
    const y=2.3+i*dqH
    s6.addText(`Q${i+1}`,{x:5.1,y,w:4.65,h:0.18,fontSize:8,bold:true,color:TEAL_DIM,fontFace:ff})
    s6.addText(q,{x:5.1,y:y+0.2,w:4.65,h:dqH-0.26,fontSize:7.5,color:TXT_MED,fontFace:ff,valign:'top'})
    if(i<dqs.slice(0,5).length-1)div(s6,5.1,y+dqH-0.04,4.65)
  })

  // Impact summary strip
  s6.addShape('RECTANGLE',{x:0,y:5.27,w:10,h:0.13,fill:{color:BG_MID},line:{color:BG_MID}})
  s6.addText(`IMPACT · ${m.impact?.co2_avoided||'Article 9 SFDR'} · GREENFIN Certified · SDGs: ${(m.impact?.sdg_alignment||[]).join(', ')||'7, 11, 13'}`,{x:0.375,y:5.28,w:9.25,h:0.12,fontSize:6,color:TXT_GREY,fontFace:ff})
  ftr(s6,6,6)

  prs.writeFile({fileName:`${(m.company||'Company').replace(/\s+/g,'_')}_GIGF_IC_Memo.pptx`})
}

// ─── Scoring Breakdown Visual ─────────────────────────────────────────────────
function ScoringBreakdown({ breakdown }) {
  if (!breakdown) return null
  const dims = [
    { key: 'growth_momentum', label: 'Growth Momentum', icon: '📈' },
    { key: 'impact_integrity', label: 'Impact Integrity', icon: '🌿' },
    { key: 'team_commitment',  label: 'Team Commitment',  icon: '👥' },
    { key: 'business_model',  label: 'Business Model',   icon: '💼' },
  ]
  return (
    <div className="space-y-2.5">
      {dims.map(({ key, label, icon }) => {
        const b = breakdown[key] || { score: 0, max: 25, note: '' }
        const pct = (b.score / b.max) * 100
        const col = pct >= 72 ? 'bg-green-400' : pct >= 48 ? 'bg-amber-400' : 'bg-red-400'
        const tcol = pct >= 72 ? 'text-green-400' : pct >= 48 ? 'text-amber-400' : 'text-red-400'
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{icon}</span>
              <span className="text-xs font-semibold text-white/70 flex-1">{label}</span>
              <span className={`font-mono text-sm font-bold ${tcol}`}>{b.score}<span className="text-white/25 font-normal">/{b.max}</span></span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${col}`} style={{ width: `${pct}%` }}/>
            </div>
            {b.note && <p className="text-white/35 text-[10px] mt-0.5 leading-relaxed">{b.note}</p>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function TabOverview({ m }) {
  const col = m.thesis_fit_score >= 70 ? 'text-green-400' : m.thesis_fit_score >= 45 ? 'text-amber-400' : 'text-red-400'
  const bg  = m.thesis_fit_score >= 70 ? 'bg-green-400' : m.thesis_fit_score >= 45 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="space-y-4">
      {/* Score + recommendation header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{m.company}</h3>
          <p className="text-white/40 text-sm mt-0.5">{m.tagline}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge>{m.recommendation}</Badge>
            <Pill>{m.sector}</Pill>
            <Pill>{m.stage}</Pill>
            <Pill>{m.geography}</Pill>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Thesis Fit</p>
          <p className={`font-mono font-bold text-4xl ${col}`}>{m.thesis_fit_score}<span className="text-sm text-white/25">/100</span></p>
        </div>
      </div>
      <div className="h-2 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bg}`} style={{ width: `${m.thesis_fit_score}%` }}/>
      </div>
      <ConfidenceFlag level={m.confidence_level || 'Medium'} note={m.confidence_note}/>

      {/* Scoring breakdown */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-4">
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-3">Scoring Breakdown</p>
        <ScoringBreakdown breakdown={m.scoring_breakdown}/>
      </div>

      {/* Executive summary */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">Executive Summary</p>
        <p className="text-sm text-white/65 leading-relaxed">{m.executive_summary}</p>
      </div>
      <div className="bg-gold/8 border border-gold/20 rounded-xl p-3.5">
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-1.5">Recommendation</p>
        <p className="text-sm text-white/70 leading-relaxed">{m.recommendation_rationale}</p>
      </div>

      {/* Market */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">Market</p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {['tam','sam','som'].map(k => (
            <div key={k} className="bg-white/4 rounded-lg p-2.5 text-center">
              <p className="text-[9px] text-white/30 uppercase tracking-wider">{k.toUpperCase()}</p>
              <p className="text-sm font-bold text-white mt-0.5">{m.market?.[k]||'—'}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/50"><span className="text-white/70 font-medium">Tailwind: </span>{m.market?.key_tailwind}</p>
      </div>
    </div>
  )
}

// ─── Tab: Deep Dive ───────────────────────────────────────────────────────────
function TabDeepDive({ m }) {
  return (
    <div className="space-y-4">
      {/* Product */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">Product & Moat</p>
        <div className="space-y-2">
          {[['What it does', m.product?.what_it_does], ['Competitive moat', m.product?.moat], ['vs Competitors', m.product?.vs_competitors]].map(([k,v]) => v ? (
            <div key={k} className="bg-white/3 rounded-xl p-3">
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-1">{k}</p>
              <p className="text-sm text-white/65 leading-relaxed">{v}</p>
            </div>
          ) : null)}
        </div>
      </div>

      {/* Team */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">Team</p>
        <div className="bg-white/3 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2"><Badge>{m.team?.founder_market_fit}</Badge><span className="text-[10px] text-white/30">founder-market fit</span></div>
          <p className="text-sm text-white/65 leading-relaxed">{m.team?.assessment}</p>
          {m.team?.key_gaps && <p className="text-xs text-white/35 mt-1.5">Gaps: {m.team.key_gaps}</p>}
        </div>
      </div>

      {/* Risks */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">Risk Register</p>
        <div className="space-y-2">
          {(m.risks||[]).map((r,i) => (
            <div key={i} className="flex items-start gap-2.5 bg-white/3 rounded-xl p-3">
              <Badge>{r.severity}</Badge>
              <div>
                <p className="text-sm font-medium text-white/75">{r.description}</p>
                {r.mitigant && <p className="text-xs text-white/35 mt-0.5">Mitigant: {r.mitigant}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparables */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">Comparables</p>
        <div className="space-y-1">
          {(m.comparables||[]).map((c,i) => (
            <div key={i} className="flex gap-3 py-2 border-b border-white/5 last:border-0 text-sm">
              <span className="font-semibold text-white">{c.company}</span>
              <span className="text-white/30">{c.round}</span>
              <span className="text-white/50 flex-1">{c.relevance}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio adjacency */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">Portfolio Adjacency</p>
        <p className="text-sm text-white/60 leading-relaxed">{m.portfolio_adjacency}</p>
      </div>

      {/* Diligence Qs */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">Diligence Questions</p>
        <div className="space-y-1">
          {(m.diligence_questions||[]).map((q,i) => (
            <div key={i} className="flex gap-2.5 py-1.5 border-b border-white/5 last:border-0 text-sm">
              <span className="font-mono font-bold text-white/25 flex-shrink-0">Q{i+1}</span>
              <span className="text-white/60">{q}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: IC Prep ─────────────────────────────────────────────────────────────
function TabICPrep({ m }) {
  return (
    <div className="space-y-4">
      {/* Red flags */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-red-400 mb-2">Red Flags — Deal Killers</p>
        {(m.red_flags||[]).length === 0
          ? <p className="text-white/30 text-sm">No critical red flags identified.</p>
          : (m.red_flags||[]).map((f,i) => (
            <div key={i} className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl p-3 mb-2">
              <span className="text-red-400 text-base flex-shrink-0">⚑</span>
              <p className="text-sm text-red-400/90">{f}</p>
            </div>
          ))
        }
      </div>

      {/* Challenges */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-amber-400 mb-2">Key Challenges</p>
        {(m.challenges||[]).map((c,i) => {
          const ch = typeof c === 'string' ? c : c.challenge
          const tl = typeof c === 'object' ? c.timeline : null
          const imp = typeof c === 'object' ? c.impact : null
          return (
            <div key={i} className="bg-amber-500/6 border border-amber-500/20 rounded-xl p-3 mb-2">
              <p className="text-sm font-semibold text-amber-400/90">{ch}</p>
              {(tl || imp) && (
                <div className="flex gap-3 mt-1">
                  {tl && <span className="text-[10px] text-amber-400/50">Timeline: {tl}</span>}
                  {imp && <span className="text-[10px] text-amber-400/50">Impact: {imp}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Partner questions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold">Partner Questions — IC (Alexandre Derreumaux)</p>
        </div>
        <p className="text-xs text-white/35 mb-3">These are the questions the senior partner will likely ask at Investment Committee. Prepare your answers before the meeting.</p>
        {(m.partner_questions||[]).map((q,i) => (
          <div key={i} className="flex gap-3 bg-navy-3 border border-white/8 rounded-xl p-3.5 mb-2">
            <span className="font-mono font-bold text-gold text-sm flex-shrink-0">Q{i+1}</span>
            <p className="text-sm text-white/70 leading-relaxed">{q}</p>
          </div>
        ))}
      </div>

      {/* Power law case */}
      {m.power_law_case && (
        <div>
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-2">Power Law Case</p>
          <div className="bg-gold/8 border border-gold/20 rounded-xl p-3.5">
            <p className="text-sm text-white/70 leading-relaxed">{m.power_law_case}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Decision (Human vs AI logging) ─────────────────────────────────────
function TabDecision({ m, user, saved, setSaved, refreshDeals, onSaveToTracker }) {
  const [decision, setDecision]                     = useState('')
  const [notes, setNotes]                           = useState('')
  const [agree, setAgree]                           = useState(null)
  const [saving, setSaving]                         = useState(false)
  const [divergenceCategory, setDivergenceCategory] = useState('')
  const [gdprConsent, setGdprConsent]               = useState(false)

  const decisions = [
    { label: 'INVEST', color: 'border-green-500/50 text-green-400 bg-green-500/10', activeColor: 'border-green-500 bg-green-500/20' },
    { label: 'WATCH',  color: 'border-amber-500/50 text-amber-400 bg-amber-500/10', activeColor: 'border-amber-500 bg-amber-500/20' },
    { label: 'PASS',   color: 'border-red-500/50 text-red-400 bg-red-500/10',       activeColor: 'border-red-500 bg-red-500/20'   },
  ]

  const agreesWithAI = m.recommendation === decision

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSaveToTracker(decision, notes, agree, divergenceCategory, gdprConsent)
      setSaved(true)
    } catch(e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      {/* AI recommendation */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-4">
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">AI Recommendation</p>
        <div className="flex items-center gap-3">
          <Badge>{m.recommendation}</Badge>
          <span className="font-mono text-gold font-bold">{m.thesis_fit_score}/100</span>
          <span className="text-xs text-white/35">{m.confidence_level} confidence</span>
        </div>
        <p className="text-xs text-white/50 mt-2 leading-relaxed">{m.recommendation_rationale}</p>
      </div>

      {/* Human decision */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-3">Your Decision</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {decisions.map(({ label, color, activeColor }) => (
            <button key={label} onClick={() => setDecision(label)}
              className={`py-3 rounded-xl border font-bold text-sm transition-all duration-200 ${decision === label ? activeColor : color}`}>
              {label}
            </button>
          ))}
        </div>
        {decision && decision !== m.recommendation && (
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-amber-400">⚡ You disagree with the AI — this divergence will be logged to improve the model.</p>
          </div>
        )}
        {decision && decision === m.recommendation && (
          <div className="bg-green-500/8 border border-green-500/20 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-green-400">✓ You agree with the AI recommendation.</p>
          </div>
        )}
      </div>

      {/* Divergence category — shown only when decision diverges from AI */}
      {decision && decision !== m.recommendation && (
        <div>
          <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-amber-400 mb-2">Divergence Category</p>
          <select value={divergenceCategory} onChange={e => setDivergenceCategory(e.target.value)}
            className="w-full bg-navy-3 border border-amber-500/30 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none transition-colors">
            <option value="">Select reason for disagreement…</option>
            <option value="Thesis mismatch">Thesis mismatch — sector, stage, or geography outside mandate</option>
            <option value="Valuation too high">Valuation too high — thesis fits but price does not</option>
            <option value="PMF doubt">PMF doubt — product-market fit evidence insufficient</option>
            <option value="Team signal concern">Team signal concern — founder background or depth concern</option>
            <option value="Market timing">Market timing — regulatory catalyst not yet in place</option>
            <option value="Regulatory moat unclear">Regulatory moat unclear — non-optional demand not demonstrated</option>
          </select>
          <p className="text-[9px] text-amber-400/50 mt-1">Categorising divergences prevents training on noise. Valuation disagreements are excluded from model updates.</p>
        </div>
      )}

      {/* Notes */}
      <div>
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/30 mb-2">Analyst Notes</p>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Add your reasoning, concerns, or conditions for this decision..."
          className="w-full bg-navy-3 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none transition-colors placeholder:text-white/20 resize-none"/>
      </div>

      {/* GDPR consent toggle */}
      <div className="flex items-start gap-3 bg-blue-500/6 border border-blue-500/15 rounded-xl p-3">
        <input type="checkbox" id="gdpr-consent" checked={gdprConsent} onChange={e => setGdprConsent(e.target.checked)}
          className="mt-0.5 flex-shrink-0 accent-gold cursor-pointer"/>
        <label htmlFor="gdpr-consent" className="cursor-pointer">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Include in AI training dataset</p>
          <p className="text-[10px] text-blue-400/60 mt-0.5 leading-relaxed">Founder consent obtained. This deal will be included in the DPO fine-tuning pipeline. Only check when founder has consented to data use.</p>
        </label>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={!decision || saving || saved}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200
          ${saved ? 'bg-green-500/15 text-green-400 border border-green-500/25 cursor-default'
                  : !decision ? 'bg-white/5 text-white/25 cursor-not-allowed'
                  : 'bg-gold text-navy hover:bg-gold-2'}`}>
        {saving ? 'Saving…' : saved ? '✓ Logged to Tracker' : 'Log Decision & Save to Pipeline'}
      </button>

      {/* Model training note */}
      <div className="bg-blue-500/6 border border-blue-500/15 rounded-xl p-3">
        <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-blue-400 mb-1">Model Training</p>
        <p className="text-xs text-blue-400/70 leading-relaxed">
          Your decision is logged alongside the AI score. Divergences (where you disagree with the AI) become training examples to fine-tune the model on GIGF's actual investment thesis over time.
        </p>
      </div>
    </div>
  )
}

// ─── Tab: Export ──────────────────────────────────────────────────────────────
function TabExport({ m }) {
  const [pptxLoading, setPptxLoading] = useState(false)

  const handlePPTX = async () => {
    setPptxLoading(true)
    try { await exportPPTX(m) }
    catch(e) { console.error('PPTX export error:', e); alert('Export failed: ' + e.message) }
    setPptxLoading(false)
  }

  return (
    <div className="space-y-3">
      <p className="text-white/40 text-sm">Export this investment memo in professional formats for IC presentation and filing.</p>
      {[
        {
          icon: '📄',
          label: 'PDF — Print to File',
          desc: 'Full IC memo formatted for print. Opens in new tab → Print → Save as PDF.',
          action: () => exportPDF(m),
          btnLabel: 'Export PDF',
          loading: false,
        },
        {
          icon: '📝',
          label: 'Word Document (.doc)',
          desc: 'Formatted IC memo with table of contents structure. Opens in Microsoft Word.',
          action: () => exportWord(m),
          btnLabel: 'Export Word',
          loading: false,
        },
        {
          icon: '📊',
          label: 'PowerPoint (.pptx)',
          desc: '6-slide IC presentation in Meridiam GIGF format — Cover, Scoring, Summary, Market, Product/Team, Red Flags, Partner Qs, Recommendation.',
          action: handlePPTX,
          btnLabel: pptxLoading ? 'Generating…' : 'Export 6-Slide GIGF PPT',
          loading: pptxLoading,
        },
      ].map(({ icon, label, desc, action, btnLabel, loading }) => (
        <div key={label} className="bg-white/3 border border-white/8 rounded-xl p-4 flex items-center gap-4">
          <span className="text-2xl flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">{label}</p>
            <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{desc}</p>
          </div>
          <button onClick={action} disabled={loading}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-gold text-navy font-bold text-sm hover:bg-gold-2 transition-colors disabled:opacity-50">
            {btnLabel}
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Tabbed Memo Output ───────────────────────────────────────────────────────
function MemoOutput({ memo, user, saved, setSaved, refreshDeals, onSaveToTracker }) {
  const [activeTab, setActiveTab] = useState('overview')
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'deepdive', label: 'Deep Dive' },
    { id: 'icprep',   label: 'IC Prep' },
    { id: 'decision', label: 'Decision' },
    { id: 'export',   label: 'Export' },
  ]
  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-0.5 bg-navy-3 border border-white/8 rounded-xl p-1 mb-4 flex-shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-150
              ${activeTab === t.id ? 'bg-gold text-navy' : 'text-white/40 hover:text-white/70'}`}>
            {t.label}
            {t.id === 'icprep' && (memo.red_flags||[]).length > 0 && (
              <span className="ml-1 text-[8px] bg-red-400 text-white rounded-full px-1">{memo.red_flags.length}</span>
            )}
          </button>
        ))}
      </div>
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === 'overview' && <TabOverview m={memo}/>}
        {activeTab === 'deepdive' && <TabDeepDive m={memo}/>}
        {activeTab === 'icprep'   && <TabICPrep   m={memo}/>}
        {activeTab === 'decision' && <TabDecision m={memo} user={user} saved={saved} setSaved={setSaved} refreshDeals={refreshDeals} onSaveToTracker={onSaveToTracker}/>}
        {activeTab === 'export'   && <TabExport   m={memo}/>}
      </div>
    </div>
  )
}

// ─── Main Screener ────────────────────────────────────────────────────────────
export default function Screener({ user, apiKey, tvKey, slackHook, deals, refreshDeals, initialCompany, onClearInitial }) {
  const [name,        setName]        = useState('')
  const [desc,        setDesc]        = useState('')
  const [deckB64,     setDeckB64]     = useState(null)
  const [deckName,    setDeckName]    = useState('')
  const [memo,        setMemo]        = useState(null)
  const [similar,     setSimilar]     = useState([])
  const [loading,     setLoading]     = useState(false)
  const [loadStep,    setLoadStep]    = useState('')
  const [error,       setError]       = useState('')
  const [showPresent, setShowPresent] = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [dragOver,    setDragOver]    = useState(false)
  const [isPortco,    setIsPortco]    = useState(false)

  // Portfolio company detection
  useEffect(() => {
    const match = PORTFOLIO_NAMES.some(p => name.toLowerCase().includes(p.toLowerCase()))
    setIsPortco(match)
  }, [name])


  // Pre-fill from Gmail → Screener handoff
  useEffect(() => {
    if (initialCompany) { setName(initialCompany); onClearInitial?.() }
  }, [initialCompany])


  const handleFile = (file) => {
    if (!file || !file.name.endsWith('.pdf')) return
    const r = new FileReader()
    r.onload = () => { setDeckB64(r.result.split(',')[1]); setDeckName(file.name) }
    r.readAsDataURL(file)
  }

  const generate = async () => {
    if (!name && !deckB64) return
    if (!apiKey) { setError('No Claude API key set — go to Settings tab and add it.'); return }
    setLoading(true); setError(''); setMemo(null); setSaved(false)
    try {
      // ── Multi-agent enrichment: 5 parallel Tavily searches ──────────────
      setLoadStep('Agent 1/5: Founder research…')
      let ctx = name ? `Company: ${name}` : 'Analyze this pitch deck'
      if (desc) ctx += '\nContext: ' + desc

      // Check if portfolio company
      const portcoMatch = PORTFOLIO.find(p => name.toLowerCase().includes(p.name.toLowerCase()))
      if (portcoMatch) {
        ctx += `\n\nNOTE: ${portcoMatch.name} is an EXISTING GIGF portfolio company (${portcoMatch.stage}, ${portcoMatch.sector}). Score based on publicly available information. Mark recommendation_rationale as "PORTFOLIO COMPANY - Already Invested."`
      }

      // Parallel enrichment if Tavily available
      setLoadStep('Running 5 research agents in parallel…')
      const enriched = name ? await enrichCompany(name, tvKey) : ''
      if (enriched && enriched.trim().length > 100) {
        ctx += enriched
      } else if (name) {
        ctx += '\n\n[STEALTH MODE DETECTED - MINIMAL PUBLIC FOOTPRINT]\nExternal data: No significant public data found. Company may be pre-domain, pre-announcement, or in stealth mode.\nScoring adjustment: Weight team commitment and impact integrity higher than market data signals.\nConfidence: Score with lower confidence given data scarcity.\nRecommended action: Prioritise direct founder outreach before further automated research.'
      }

      setLoadStep('Agent 6: Claude IC analysis…')

      setLoadStep('Running 5 agents: Research · Screener · Memory · Comparables · IC Prep…')
      let raw
      if (deckB64) {
        const headers = { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
        if (apiKey) headers['x-api-key'] = apiKey
        const body = { model: 'claude-haiku-4-5-20251001', max_tokens: 4096, system: MEMO_SYSTEM, messages: [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: deckB64 } }, { type: 'text', text: ctx }] }] }
        const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) })
        const d = await res.json()
        raw = d.content.filter(b => b.type === 'text').map(b => b.text).join('')
        setDeckB64(null); setDeckName('')
      } else {
        raw = await claudeAPI(MEMO_SYSTEM, ctx, apiKey)
      }

      setLoadStep('Parsing memo…')
      const m = parseJSON(raw)
      setMemo(m)
      // Slack alert on high-score deals
      if (m.thesis_fit_score >= 70 && slackHook) {
        fetch(slackHook, {
          method: 'POST',
          body: JSON.stringify({ text: `⚡ *[${m.recommendation}]* ${m.company} — Score: *${m.thesis_fit_score}/100*\n> ${m.tagline || ''}\n> Sector: ${m.sector || ''} | ${m.stage || ''}\n> _Screened via GIGF Intelligence_` }),
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => {})
      }

      if (m.sector && m.company && user?.uid) {
        const sim = await getSimilarDeals(user.uid, m.sector, m.company)
        setSimilar(sim)
      }
    } catch(e) { setError(e.message || 'Generation failed. Check API key and try again.') }
    setLoading(false); setLoadStep('')
  }

  const handleSaveToTracker = async (humanDecision, notes, agree, divergenceCategory, gdprConsent) => {
    if (!memo || !user?.uid) return
    const divergence = memo.recommendation !== humanDecision
    await saveDeal(user.uid, {
      company:           memo.company,
      sector:            memo.sector,
      stage:             memo.stage,
      score:             memo.thesis_fit_score,
      rec:               memo.recommendation,
      conf:              memo.confidence_level || 'Medium',
      humanStatus:       humanDecision || 'Screening',
      humanDecision,
      notes,
      aiAgree:           agree,
      divergence,
      divergenceCategory: divergence ? (divergenceCategory || '') : '',
      gdprConsent:       gdprConsent || false,
      memo,
    })
    await refreshDeals()
    setSaved(true)
  }

  const criteria = [
    ['Sector',       '5 ecological transition sectors'],
    ['Stage',        'Series B/C, >15% revenue growth'],
    ['Impact',       'Article 9 SFDR + GREENFIN eligible'],
    ['Ticket',       'EUR 5-30M, pure equity, no leverage'],
    ['Geography',    'Europe only'],
    ['Profitability','Path within 12-24 months'],
  ]

  return (
    <div>
      <div className="mb-6">
        <Label>GIGF Screener</Label>
        <h2 className="text-2xl font-bold text-white mt-2">Impact Memo Generator</h2>
        <p className="text-white/40 text-sm mt-1">Screen any company against GIGF's 4 mandatory criteria + 5 sector thesis. Includes AI analysis appendix.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">

        {/* ── LEFT PANEL ── */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            {/* Company name */}
            <div>
              <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-medium text-white/50">Company Name</p>
              {isPortco && (
                <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25 tracking-wider">
                  ◈ Portfolio Company
                </span>
              )}
            </div>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Chargepoly, iwell, Oxand, or new company…"
                onKeyDown={e => e.key === 'Enter' && generate()}
                className="w-full bg-navy-3 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"/>
            </div>

            {/* Context */}
            <div>
              <p className="text-[10px] font-medium text-white/50 mb-1">Context (optional)</p>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
                placeholder="Paste pitch excerpt, URL, or context"
                className="w-full bg-navy-3 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none transition-colors placeholder:text-white/20 resize-none"/>
            </div>

            {/* PDF upload */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => document.getElementById('pdf-upload').click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors duration-200
                ${dragOver ? 'border-gold bg-gold/5' : 'border-white/15 hover:border-white/30'}`}>
              <input type="file" id="pdf-upload" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])}/>
              {deckName ? (
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {deckName}
                </div>
              ) : (
                <div>
                  <svg className="w-6 h-6 mx-auto mb-2 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                  <p className="text-white/30 text-xs">Drop pitch deck PDF or click to upload</p>
                </div>
              )}
            </div>

            {/* Generate button */}
            <button onClick={generate} disabled={loading || (!name && !deckB64)}
              className="w-full flex items-center justify-center gap-2 bg-gold text-navy rounded-xl py-3 font-bold text-sm hover:bg-gold-2 transition-colors disabled:opacity-40 disabled:cursor-wait">
              {loading && <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"/>}
              {loading ? loadStep || 'Generating…' : 'Generate GIGF Impact Memo'}
            </button>

            {/* Present button */}
            {memo && (
              <button onClick={() => setShowPresent(true)}
                className="w-full py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/5 hover:text-white transition-colors">
                ▶ Present Mode
              </button>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-red-400 text-sm">
                {error}
              </div>
            )}
          </Card>

          {/* Similar deals */}
          {similar.length > 0 && (
            <Card className="p-4">
              <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-3">Similar Past Deals</p>
              {similar.map((d,i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{d.company}</p>
                    <p className="text-[10px] text-white/35">{d.sector} · {new Date(d.createdAt).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-sm ${d.score>=70?'text-green-400':d.score>=45?'text-amber-400':'text-red-400'}`}>{d.score}</span>
                    <Badge>{d.rec}</Badge>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Scoring criteria */}
          <Card className="p-4">
            <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold mb-3">GIGF Thesis</p>
            {criteria.map(([k,v]) => (
              <div key={k} className="flex gap-3 py-1.5 border-b border-white/5 last:border-0 text-xs">
                <span className="text-white/30 w-24 flex-shrink-0">{k}</span>
                <span className="text-white/60">{v}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="min-h-[600px]">
          {!memo && !loading && (
            <Card className="h-full min-h-[500px] flex items-center justify-center p-8">
              <Empty
                title="Enter a company and click Generate"
                subtitle="5 parallel agents: Founders · Growth · Competitors · Impact · Market"
                icon="📋"
              />
            </Card>
          )}
          {loading && (
            <Card className="h-full min-h-[500px] flex flex-col items-center justify-center p-8 gap-4">
              <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
              <div className="text-center">
                <p className="text-white/60 text-sm">{loadStep || 'Running agents…'}</p>
                <p className="text-white/25 text-xs mt-1">{tvKey ? 'Searching live data + Claude analysis' : 'Claude analysis (add Tavily key for live data)'}</p>
              </div>
            </Card>
          )}
          {memo && (
            <Card className="p-5 min-h-[500px] flex flex-col">
              <MemoOutput
                memo={memo}
                user={user}
                saved={saved}
                setSaved={setSaved}
                refreshDeals={refreshDeals}
                onSaveToTracker={handleSaveToTracker}
              />
            </Card>
          )}
        </div>
      </div>

      {showPresent && memo && <MemoPresent memo={memo} onClose={() => setShowPresent(false)}/>}
    </div>
  )
}
