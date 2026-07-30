import { useState, useEffect, useRef } from 'react'

// Light paper background, scrollable slides, full content shown
export default function MemoPresent({ memo: m, onClose }) {
  const [idx, setIdx]   = useState(0)
  const scrollRef       = useRef(null)
  const score           = m.thesis_fit_score || 0
  const scoreCol        = score >= 70 ? '#2D7A47' : score >= 45 ? '#C9A84C' : '#E05252'
  const TEAL            = '#3FA88F'
  const DARK            = '#162F28'
  const MID             = '#4A9E6B'

  // Scroll to top when slide changes
  useEffect(() => { scrollRef.current?.scrollTo({top:0, behavior:'smooth'}) }, [idx])

  useEffect(() => {
    const h = e => {
      if (e.key==='ArrowRight'||e.key==='ArrowDown') setIdx(i=>Math.min(i+1,slides.length-1))
      if (e.key==='ArrowLeft'||e.key==='ArrowUp')   setIdx(i=>Math.max(i-1,0))
      if (e.key==='Escape') onClose()
    }
    window.addEventListener('keydown',h)
    return ()=>window.removeEventListener('keydown',h)
  },[])

  const Lbl = ({children}) => (
    <p style={{fontSize:9,fontWeight:700,color:TEAL,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:4}}>
      {children}
    </p>
  )
  const SecLbl = ({children}) => (
    <p style={{fontSize:10,fontWeight:700,color:TEAL,letterSpacing:'0.15em',textTransform:'uppercase',
               borderBottom:`1px solid #D7E2DD`,paddingBottom:6,marginBottom:10}}>
      {children}
    </p>
  )
  const Divider = ()=><div style={{borderBottom:'1px solid #D7E2DD',margin:'12px 0'}}/>

  // ─── SLIDE DEFINITIONS ──────────────────────────────────────────
  const slides = [
    // ── 1. COVER ──────────────────────────────────────────────────
    { title:'Portfolio Snapshot', content:(
      <div>
        <div style={{background:DARK,borderRadius:12,padding:'20px 24px',marginBottom:16}}>
          <p style={{fontSize:9,color:'#5ECCB5',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:6}}>PORTFOLIO SNAPSHOT</p>
          <h2 style={{fontSize:32,fontWeight:800,color:'#fff',lineHeight:1.1,marginBottom:4}}>{m.company||''}</h2>
          <p style={{fontSize:12,color:'rgba(255,255,255,0.6)',marginBottom:12}}>{m.tagline||''}</p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
            {[m.sector,m.stage,m.geography].filter(Boolean).map(t=>(
              <span key={t} style={{fontSize:9,padding:'3px 10px',borderRadius:20,background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.15)'}}>{t}</span>
            ))}
          </div>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <div style={{background:'#5ECCB5',borderRadius:8,padding:'8px 16px',textAlign:'center',minWidth:110}}>
              <p style={{fontSize:8,color:DARK,fontWeight:700,letterSpacing:'0.12em',marginBottom:2}}>RECOMMENDATION</p>
              <p style={{fontSize:11,fontWeight:800,color:DARK,lineHeight:1.2}}>{m.recommendation||''}</p>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:9,color:'rgba(255,255,255,0.4)',marginBottom:4}}>THESIS FIT</p>
              <p style={{fontSize:40,fontWeight:800,fontFamily:'Courier New',color:'#5ECCB5',lineHeight:1}}>{score}<span style={{fontSize:16,color:'rgba(255,255,255,0.3)'}}>/100</span></p>
              <p style={{fontSize:9,color:'#3FA88F',marginTop:2}}>CONFIDENCE: {(m.confidence_level||'MEDIUM').toUpperCase()}</p>
            </div>
          </div>
        </div>
        {m.impact?.sdg_alignment?.length>0 && (
          <div style={{background:'#F0FDF4',borderRadius:10,padding:'12px 16px',border:'1px solid #BBF7D0',marginBottom:12}}>
            <Lbl>SDG Alignment</Lbl>
            <p style={{fontSize:11,color:DARK}}>{(m.impact.sdg_alignment||[]).join(' · ')}</p>
            {m.impact.co2_avoided && <p style={{fontSize:11,color:DARK,marginTop:4}}>🌱 {m.impact.co2_avoided}</p>}
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[['Article 9 SFDR',m.impact?.article9_compliant?'✓ Compliant':'Review needed'],
            ['GREENFIN',m.impact?.greenfin_eligible?'✓ Eligible':'Review needed']].map(([k,v])=>(
            <div key={k} style={{background:'#F7F9F8',borderRadius:8,padding:'10px 12px',border:'1px solid #D7E2DD'}}>
              <Lbl>{k}</Lbl>
              <p style={{fontSize:12,fontWeight:700,color:DARK}}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    )},

    // ── 2. THESIS & SCORING ──────────────────────────────────────
    { title:'Investment Thesis & Scoring', content:(
      <div>
        <div style={{background:DARK,borderRadius:10,padding:'14px 18px',marginBottom:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
            {[['RECOMMENDATION',m.recommendation||'—'],['ROUND',m.stage||'—'],['HOLD PERIOD','12 + 3 years']].map(([l,v])=>(
              <div key={l}>
                <p style={{fontSize:8,color:'rgba(255,255,255,0.4)',letterSpacing:'0.12em',marginBottom:3}}>{l}</p>
                <p style={{fontSize:13,fontWeight:700,color:'#fff'}}>{v}</p>
              </div>
            ))}
          </div>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.65)',lineHeight:1.5}}>{m.recommendation_rationale||''}</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[
            {key:'growth_momentum',label:'Growth Momentum',num:'01'},
            {key:'impact_integrity',label:'Impact Integrity',num:'02'},
            {key:'team_commitment',label:'Team Commitment',num:'03'},
            {key:'business_model',label:'Business Model',num:'04'},
          ].map(d=>{
            const b=m.scoring_breakdown?.[d.key]||{score:0,max:25,note:''}
            const pct=b.score/25
            const col=b.score>=18?'#2D7A47':b.score>=12?'#C9A84C':'#E05252'
            return(
              <div key={d.key} style={{background:'#F7F9F8',borderRadius:10,padding:'12px 14px',border:'1px solid #D7E2DD'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                  <div>
                    <span style={{fontSize:9,color:TEAL,fontWeight:700,marginRight:6}}>{d.num}</span>
                    <span style={{fontSize:11,fontWeight:700,color:DARK}}>{d.label}</span>
                  </div>
                  <span style={{fontSize:16,fontWeight:800,fontFamily:'Courier New',color:col}}>{b.score}/25</span>
                </div>
                <div style={{height:5,background:'#D7E2DD',borderRadius:3,marginBottom:8}}>
                  <div style={{height:'100%',width:`${pct*100}%`,background:col,borderRadius:3}}/>
                </div>
                <p style={{fontSize:10,color:'#4B5A55',lineHeight:1.5}}>{b.note||''}</p>
              </div>
            )
          })}
        </div>
        {/* Mandatory criteria */}
        <Divider/>
        <SecLbl>Mandatory Criteria</SecLbl>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          {Object.entries(m.mandatory_criteria||{}).map(([k,v])=>(
            <div key={k} style={{display:'flex',gap:8,alignItems:'flex-start',background:v.pass?'#F0FDF4':'#FEF2F2',borderRadius:8,padding:'8px 10px',border:`1px solid ${v.pass?'#BBF7D0':'#FECACA'}`}}>
              <span style={{fontSize:14,color:v.pass?'#2D7A47':'#E05252',fontWeight:800,flexShrink:0}}>{v.pass?'✓':'✗'}</span>
              <div>
                <p style={{fontSize:9,fontWeight:700,color:v.pass?'#2D7A47':'#E05252',textTransform:'uppercase',letterSpacing:'0.1em'}}>{k.replace(/_/g,' ')}</p>
                <p style={{fontSize:10,color:'#4B5A55',marginTop:2}}>{v.note||''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )},

    // ── 3. MARKET, MOAT & GLOBAL ─────────────────────────────────
    { title:'Market & Global Perspective', content:(
      <div>
        <SecLbl>Market Size</SecLbl>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
          {['tam','sam','som'].map(k=>(
            <div key={k} style={{background:'#F7F9F8',borderRadius:10,padding:'12px',border:'1px solid #D7E2DD',textAlign:'center'}}>
              <p style={{fontSize:9,color:TEAL,fontWeight:700,letterSpacing:'0.2em'}}>{k.toUpperCase()}</p>
              <p style={{fontSize:18,fontWeight:800,color:DARK,margin:'4px 0'}}>{m.market?.[k]||'—'}</p>
            </div>
          ))}
        </div>
        <div style={{background:'#F0FDF4',borderRadius:10,padding:'12px 14px',border:'1px solid #BBF7D0',marginBottom:14}}>
          <Lbl>Key Regulatory Tailwind</Lbl>
          <p style={{fontSize:11,color:DARK,lineHeight:1.6}}>{m.market?.key_tailwind||''}</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          {[['Product & Model',m.product?.what_it_does||''],['Competitive Moat',m.product?.moat||'']].map(([l,v])=>(
            <div key={l} style={{background:'#F7F9F8',borderRadius:10,padding:'12px 14px',border:'1px solid #D7E2DD'}}>
              <Lbl>{l}</Lbl>
              <p style={{fontSize:11,color:'#2D3A34',lineHeight:1.5}}>{v}</p>
            </div>
          ))}
        </div>
        {/* VS Competitors */}
        {m.product?.vs_competitors && (
          <div style={{background:'#FFF8EC',borderRadius:10,padding:'12px 14px',border:'1px solid #FDE68A',marginBottom:14}}>
            <Lbl>vs Competitors</Lbl>
            <p style={{fontSize:11,color:DARK,lineHeight:1.5}}>{m.product.vs_competitors}</p>
          </div>
        )}
        <Divider/>
        <SecLbl>Global Perspective</SecLbl>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
          {[
            ['🌍 Global Tailwinds',m.global_perspective?.tailwinds||'','#F0FDF4','#BBF7D0'],
            ['⚠️ Global Threats',m.global_perspective?.threats||'','#FEF2F2','#FECACA'],
            ['🚀 Global Opportunity',m.global_perspective?.opportunity||'','#F0F9FF','#BAE6FD'],
          ].map(([l,v,bg,border])=>(
            <div key={l} style={{background:bg,borderRadius:10,padding:'12px',border:`1px solid ${border}`}}>
              <Lbl>{l}</Lbl>
              <p style={{fontSize:10,color:DARK,lineHeight:1.5}}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    )},

    // ── 4. TEAM & COMPARABLES ─────────────────────────────────────
    { title:'Team & Comparable Transactions', content:(
      <div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div>
            <SecLbl>Team Assessment</SecLbl>
            <div style={{background:'#F7F9F8',borderRadius:10,padding:'12px 14px',border:'1px solid #D7E2DD',marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <p style={{fontSize:10,color:TEAL,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase'}}>Founder–Market Fit</p>
                <span style={{fontSize:9,fontWeight:700,padding:'3px 10px',borderRadius:20,
                  background:(m.team?.founder_market_fit||'').toLowerCase()==='high'?'#2D7A47':'#C9A84C',
                  color:'#fff'}}>{(m.team?.founder_market_fit||'HIGH').toUpperCase()}</span>
              </div>
              <p style={{fontSize:11,color:'#2D3A34',lineHeight:1.5}}>{m.team?.assessment||''}</p>
            </div>
            <div style={{background:'#F7F9F8',borderRadius:10,padding:'12px 14px',border:'1px solid #D7E2DD'}}>
              <Lbl>Gaps & Recommended DD</Lbl>
              {(m.team?.key_gaps||'').split(/[.;]/).filter(g=>g.trim()).map((gap,i)=>(
                <div key={i} style={{display:'flex',gap:8,marginBottom:6}}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:TEAL,flexShrink:0,marginTop:5}}/>
                  <p style={{fontSize:10,color:'#2D3A34',lineHeight:1.5}}>{gap.trim()}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SecLbl>Comparable Transactions</SecLbl>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(m.comparables||[]).map((c,i)=>(
                <div key={i} style={{background:'#F7F9F8',borderRadius:10,padding:'12px 14px',border:'1px solid #D7E2DD'}}>
                  <p style={{fontSize:8,color:TEAL,fontWeight:700,letterSpacing:'0.15em',marginBottom:3}}>COMP {String(i+1).padStart(2,'0')}</p>
                  <p style={{fontSize:12,fontWeight:700,color:DARK,marginBottom:2}}>{c.company||''}</p>
                  <p style={{fontSize:9,color:TEAL,marginBottom:4}}>{c.round||''}</p>
                  <p style={{fontSize:10,color:'#4B5A55',lineHeight:1.4}}>{c.relevance||''}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )},

    // ── 5. RED FLAGS & QUESTIONS ──────────────────────────────────
    { title:'IC Prep — Red Flags & Questions', content:(
      <div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div>
            <SecLbl>Red Flags — Deal Killers</SecLbl>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(m.red_flags||[]).map((flag,i)=>(
                <div key={i} style={{display:'flex',gap:10,background:'#FEF2F2',borderRadius:10,padding:'10px 12px',border:'1px solid #FECACA'}}>
                  <div style={{width:22,height:22,borderRadius:4,background:'#E05252',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:11,fontWeight:800,color:'#fff',lineHeight:1}}>!</span>
                  </div>
                  <div>
                    <p style={{fontSize:8,fontWeight:700,color:'#E05252',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:2}}>Red Flag {String(i+1).padStart(2,'0')}</p>
                    <p style={{fontSize:10,color:'#2D3A34',lineHeight:1.4}}>{flag}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SecLbl>Questions — Alexandre Derreumaux (IC Partner)</SecLbl>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(m.partner_questions||[]).map((q,i)=>(
                <div key={i} style={{display:'flex',gap:10,background:'#F7F9F8',borderRadius:10,padding:'10px 12px',border:'1px solid #D7E2DD'}}>
                  <div style={{width:22,height:22,borderRadius:4,background:'#5ECCB5',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:10,fontWeight:800,color:DARK}}>Q{i+1}</span>
                  </div>
                  <p style={{fontSize:10,color:'#2D3A34',lineHeight:1.4}}>{q}</p>
                </div>
              ))}
            </div>
            <div style={{background:'#F0F9FF',borderRadius:10,padding:'10px 12px',border:'1px solid #BAE6FD',marginTop:10}}>
              <p style={{fontSize:8,color:'#0284C7',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:3}}>🤖 AI Analysis Appendix</p>
              <p style={{fontSize:9,color:'#334155'}}>AI-generated: research, scoring, red flags, questions. Human judgment required: IC decision, valuation, board strategy, Article 9 sign-off.</p>
            </div>
          </div>
        </div>
      </div>
    )},

    // ── 6. INVESTMENT DECISION ────────────────────────────────────
    { title:'Investment Decision', content:(
      <div>
        <div style={{background:DARK,borderRadius:12,padding:'16px 20px',marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
            <div>
              <p style={{fontSize:8,color:'#5ECCB5',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:4}}>RECOMMENDATION</p>
              <p style={{fontSize:18,fontWeight:800,color:'#fff'}}>{m.recommendation||''}</p>
            </div>
            <div style={{textAlign:'right'}}>
              <p style={{fontSize:8,color:'rgba(255,255,255,0.4)',marginBottom:2}}>THESIS FIT</p>
              <p style={{fontSize:32,fontWeight:800,fontFamily:'Courier New',color:'#5ECCB5',lineHeight:1}}>{score}/100</p>
            </div>
          </div>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.7)',lineHeight:1.5}}>{m.recommendation_rationale||''}</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div>
            <SecLbl>Power Law Case — Why Category Winner</SecLbl>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(m.power_law_case||'').split('. ').filter(Boolean).map((line,i)=>(
                <div key={i} style={{display:'flex',gap:10,background:'#F0FDF4',borderRadius:10,padding:'10px 12px',border:'1px solid #BBF7D0'}}>
                  <span style={{fontSize:14,fontWeight:800,color:'#5ECCB5',fontFamily:'Courier New',flexShrink:0,lineHeight:1.2}}>{i+1}</span>
                  <p style={{fontSize:10,color:'#2D3A34',lineHeight:1.4}}>{line.trim()}</p>
                </div>
              ))}
            </div>
            {/* Return scenarios */}
            {(m.return_scenarios?.base||m.return_scenarios?.bull) && (
              <>
                <Divider/>
                <SecLbl>Return Scenarios</SecLbl>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {[['Base',m.return_scenarios?.base,'#FFF8EC','#FDE68A'],
                    ['Bull',m.return_scenarios?.bull,'#F0FDF4','#BBF7D0'],
                    ['Bear',m.return_scenarios?.bear,'#FEF2F2','#FECACA']].filter(([,v])=>v).map(([l,v,bg,border])=>(
                    <div key={l} style={{background:bg,borderRadius:8,padding:'8px 12px',border:`1px solid ${border}`}}>
                      <span style={{fontSize:9,fontWeight:700,color:DARK,marginRight:8}}>{l.toUpperCase()}</span>
                      <span style={{fontSize:10,color:'#2D3A34'}}>{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div>
            <SecLbl>Diligence Questions</SecLbl>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(m.diligence_questions||[]).map((q,i)=>(
                <div key={i} style={{background:'#F7F9F8',borderRadius:10,padding:'10px 12px',border:'1px solid #D7E2DD'}}>
                  <p style={{fontSize:9,fontWeight:700,color:TEAL,marginBottom:3}}>Q{i+1}</p>
                  <p style={{fontSize:10,color:'#2D3A34',lineHeight:1.4}}>{q}</p>
                </div>
              ))}
            </div>
            {/* Impact summary */}
            {m.impact?.impact_note && (
              <>
                <Divider/>
                <div style={{background:'#F0FDF4',borderRadius:10,padding:'12px 14px',border:'1px solid #BBF7D0'}}>
                  <Lbl>Impact Summary</Lbl>
                  <p style={{fontSize:11,color:DARK,lineHeight:1.5}}>{m.impact.impact_note}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )},
  ]

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:50,
      background:'rgba(22,47,40,0.97)',
      display:'flex',flexDirection:'column',
      fontFamily:'"Plus Jakarta Sans",system-ui,sans-serif'
    }}>
      {/* Top bar */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'12px 20px',
        background:'rgba(22,47,40,1)',
        borderBottom:'1px solid rgba(94,204,181,0.15)',
        flexShrink:0
      }}>
        <div style={{fontFamily:'Courier New',fontSize:11,color:'rgba(255,255,255,0.3)'}}>
          {String(idx+1).padStart(2,'0')} / {String(slides.length).padStart(2,'0')}
        </div>
        <div style={{textAlign:'center'}}>
          <p style={{fontSize:10,fontWeight:700,color:'#5ECCB5',letterSpacing:'0.2em',textTransform:'uppercase'}}>
            {slides[idx].title}
          </p>
          <p style={{fontSize:8,color:'rgba(255,255,255,0.2)',letterSpacing:'0.15em'}}>GIGF INTELLIGENCE · MERIDIAM</p>
        </div>
        <button onClick={onClose} style={{
          width:30,height:30,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.15)',
          background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.5)',
          cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'
        }}>✕</button>
      </div>

      {/* Scrollable content area — light paper background */}
      <div ref={scrollRef} style={{
        flex:1,
        overflowY:'auto',
        background:'#F7F9F8',
        padding:'20px 24px',
      }}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          {slides[idx].content}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'center',gap:16,
        padding:'12px 20px',
        background:'rgba(22,47,40,1)',
        borderTop:'1px solid rgba(94,204,181,0.15)',
        flexShrink:0
      }}>
        <button onClick={()=>setIdx(i=>Math.max(i-1,0))} disabled={idx===0}
          style={{
            padding:'7px 20px',borderRadius:8,border:'1px solid rgba(255,255,255,0.15)',
            background:'rgba(255,255,255,0.05)',color:idx===0?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.7)',
            cursor:idx===0?'default':'pointer',fontSize:12,fontWeight:600
          }}>
          Prev
        </button>

        <div style={{display:'flex',gap:6}}>
          {slides.map((_,i)=>(
            <button key={i} onClick={()=>setIdx(i)} style={{
              height:6,width:i===idx?20:6,borderRadius:3,border:'none',cursor:'pointer',
              background:i===idx?'#5ECCB5':'rgba(255,255,255,0.2)',
              transition:'all 0.2s'
            }}/>
          ))}
        </div>

        <button
          onClick={()=>idx===slides.length-1?onClose():setIdx(i=>i+1)}
          style={{
            padding:'7px 20px',borderRadius:8,border:'none',
            background:idx===slides.length-1?'#5ECCB5':'rgba(255,255,255,0.1)',
            color:idx===slides.length-1?'#162F28':'rgba(255,255,255,0.7)',
            cursor:'pointer',fontSize:12,fontWeight:600
          }}>
          {idx===slides.length-1?'Close':'Next'}
        </button>
      </div>

      <div style={{
        textAlign:'center',padding:'6px',fontSize:9,
        color:'rgba(255,255,255,0.15)',background:'rgba(22,47,40,1)'
      }}>
        Use arrow keys to navigate · Scroll within each slide for full content
      </div>
    </div>
  )
}
