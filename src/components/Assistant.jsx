// ─── Assistant.jsx — FULL LP REPORT ADDITION ────────────────────────────────
//
// This file shows ALL changes needed in Assistant.jsx.
// Two changes total:
//   A) Add LP Report quick-action button in the UI
//   B) Inject deal data into system prompt when sending
//
// ─── CHANGE A: LP Report Quick Action Button ─────────────────────────────────
//
// Find your existing quick-action buttons area in the JSX.
// They are typically rendered as a row of small buttons above or below the input.
// Add this button alongside the existing ones:

// QUICK ACTION BUTTON (add to your existing quick-actions row):
{/*
<button
  onClick={handleLPReport}
  className="bg-white/8 text-white/70 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors duration-200 hover:border-gold/30 hover:text-gold flex items-center gap-2"
>
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M1 2h10M1 5h7M1 8h9M1 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
  Generate LP Report
</button>
*/}

// ─── CHANGE B: handleLPReport function ───────────────────────────────────────
//
// Add this function inside your Assistant component, alongside other handlers:
//
// const handleLPReport = () => {
//   setInput('Generate a quarterly LP report from my deal data. Be professional and factual.');
// };
//
// ─── CHANGE C: Modified send() function with deal data injection ──────────────
//
// Find your existing send() function. The key change is adding dealSummary
// to the system prompt context. Below is the complete updated send() function.
// Replace your existing one with this:

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Your component must receive `deals` as a prop:
//   function Assistant({ deals = [] }) { ... }
// And the parent must pass it:
//   <Assistant deals={deals} />
// ─────────────────────────────────────────────────────────────────────────────

// ─── COMPLETE Assistant.jsx (full file, with both additions) ─────────────────
// Replace your entire Assistant.jsx with this:

import { useState, useRef, useEffect } from 'react';

// ── System prompt ─────────────────────────────────────────────────────────────
const ASSISTANT_SYSTEM = `You are GIGF Intel, an AI analyst assistant for a FinTech-focused venture capital fund.

You help with:
- Deal analysis and investment memos
- Market research and competitive landscapes
- LP (Limited Partner) report generation
- Portfolio monitoring and KPI review
- FinTech sector insights

When generating LP reports, use this exact structure:
---
**BLACKFIN CAPITAL — QUARTERLY LP REPORT**
*[Quarter] [Year]*

**1. EXECUTIVE SUMMARY**
[2-3 sentences: overall activity, key themes, performance direction]

**2. DEAL ACTIVITY**
[Table or bullet list of deals: Company | Sector | AI Score | Status | Notes]

**3. PORTFOLIO HIGHLIGHTS**
[Top 2-3 performing or progressed deals with brief rationale]

**4. MARKET OBSERVATIONS**
[2-3 FinTech sector themes observed in the deal flow this quarter]

**5. OUTLOOK**
[Forward-looking statement on pipeline quality and investment thesis alignment]
---

Always be professional, factual, and concise. Do not speculate beyond the data provided.
Do not invent metrics or valuations not in the deal data.
Tone: institutional, confident, LP-ready.`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function Assistant({ apiKey = '', deals = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── LP Report quick-fill ──────────────────────────────────────────────────
  const handleLPReport = () => {
    setInput('Generate a quarterly LP report from my deal data. Be professional and factual.');
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Build deal summary for system context (top 20 deals)
      const dealSummary = deals
        .slice(0, 20)
        .map((d) => `${d.company} (${d.sector || 'Unknown'}, ${d.score ?? '—'}/100, ${d.rec || '—'}, Status: ${d.humanStatus || 'Unset'})`)
        .join(', ');

      // Compose system prompt with deal context
      const systemWithContext = dealSummary
        ? `${ASSISTANT_SYSTEM}\n\nCurrent portfolio data: ${dealSummary}`
        : ASSISTANT_SYSTEM;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey || import.meta.env.VITE_ANTHROPIC_KEY || '',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          system: systemWithContext,
          messages: nextMessages,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const assistantText = data.content?.[0]?.text ?? '(No response)';

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantText },
      ]);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Assistant API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ── Quick actions ─────────────────────────────────────────────────────────
  const quickActions = [
    { label: 'Summarize pipeline', prompt: 'Give me a quick summary of my current deal pipeline.' },
    { label: 'Top opportunities',  prompt: 'Which deals in my pipeline have the highest investment potential and why?' },
    { label: 'Sector breakdown',   prompt: 'Break down my pipeline by sector and highlight any concentration risks.' },
    { label: 'Generate LP Report', prompt: 'Generate a quarterly LP report from my deal data. Be professional and factual.', isLP: true },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold bg-gold/10 border border-gold/20 px-2 py-1 rounded">
          AI Assistant
        </span>
        <span className="text-white/40 text-xs">
          Powered by Claude Haiku · {deals.length} deals in context
        </span>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickActions.map((qa) => (
          <button
            key={qa.label}
            onClick={() => setInput(qa.prompt)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors duration-200 font-semibold
              ${qa.isLP
                ? 'bg-gold/10 text-gold border-gold/30 hover:bg-gold/20'
                : 'bg-white/5 text-white/60 border-white/10 hover:border-gold/30 hover:text-gold'
              }`}
          >
            {qa.isLP && (
              <svg className="inline w-3 h-3 mr-1 -mt-0.5" viewBox="0 0 12 12" fill="none">
                <path d="M1 2h10M1 5h7M1 8h9M1 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            )}
            {qa.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/20 text-sm">Ask anything about your pipeline, or generate an LP report.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-gold/10 text-white border border-gold/20'
                  : 'bg-navy-2 text-white/80 border border-white/10'
                }`}
              style={{ whiteSpace: 'pre-wrap', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-navy-2 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your pipeline, request analysis, generate a report…"
          className="flex-1 bg-navy-3 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white
            focus:border-gold focus:outline-none resize-none transition-colors duration-200
            placeholder:text-white/20"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-gold text-navy rounded-xl px-4 py-2.5 font-bold text-sm
            hover:bg-gold-2 transition-colors duration-200
            disabled:opacity-30 disabled:cursor-not-allowed self-end"
        >
          Send
        </button>
      </div>

      {/* LP report note */}
      {input.toLowerCase().includes('lp report') && (
        <p className="text-white/30 text-[10px] mt-2">
          LP report will include all {Math.min(deals.length, 20)} deals in context.
          {deals.length > 20 && ` (Top 20 of ${deals.length} shown.)`}
        </p>
      )}
    </div>
  );
}
