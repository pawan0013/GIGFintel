import { useState, useEffect, useCallback } from 'react';
import { claudeAPI, tavily } from '../api';

// ─── Shared Utilities ────────────────────────────────────────────────────────

const scoreColor = (score) => {
  if (score >= 70) return 'text-green-400';
  if (score >= 45) return 'text-amber-400';
  return 'text-red-400';
};

const scoreBg = (score) => {
  if (score >= 70) return 'bg-green-400/10 border-green-400/20 text-green-400';
  if (score >= 45) return 'bg-amber-400/10 border-amber-400/20 text-amber-400';
  return 'bg-red-400/10 border-red-400/20 text-red-400';
};

const parseJSON = (text) => {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
};

const parseJSONArray = (text) => {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start === -1 || end === -1) {
      // try wrapping loose objects
      const obj = parseJSON(text);
      return obj ? [obj] : null;
    }
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
};

const EmptyState = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-8 gap-2">
    <span className="text-3xl opacity-30">{icon}</span>
    <p className="text-white/40 text-xs font-bold tracking-[0.1em] uppercase">{title}</p>
    {subtitle && <p className="text-white/25 text-[10px] text-center max-w-[200px]">{subtitle}</p>}
  </div>
);

const Spinner = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-8 gap-3">
    <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
    {label && <p className="text-white/40 text-[10px] tracking-[0.1em] uppercase">{label}</p>}
  </div>
);

const SectionHeader = ({ title, badge, children }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <h3 className="text-white text-sm font-bold tracking-[0.05em]">{title}</h3>
      {badge && (
        <span className="text-[9px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold">
          {badge}
        </span>
      )}
    </div>
    {children}
  </div>
);

const PrimaryButton = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="bg-gold text-navy rounded-xl px-4 py-2.5 font-bold text-sm hover:bg-gold-2 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
  >
    {children}
  </button>
);

// ─── SUB-SECTION 1: GitHub Radar ─────────────────────────────────────────────

const GitHubRadar = ({ apiKey }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState('');

  const daysSince = (dateStr) => {
    const d = new Date(dateStr);
    return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  };

  const scanGitHub = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      setLoadingStep('Fetching RegTech + AI repos…');
      const headers = { Accept: 'application/vnd.github+json' };

      const [res1, res2] = await Promise.all([
        fetch(
          'https://api.github.com/search/repositories?q=topic:regtech+topic:ai+created:>2026-01-01&sort=stars&per_page=15',
          { headers }
        ),
        fetch(
          'https://api.github.com/search/repositories?q=topic:aml+topic:compliance+language:python+pushed:>2026-03-01&sort=stars&per_page=10',
          { headers }
        ),
      ]);

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
      const allRepos = [
        ...(data1.items || []),
        ...(data2.items || []),
      ];

      // Deduplicate by id
      const seen = new Set();
      const filtered = allRepos.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        const pushed = daysSince(r.pushed_at);
        return r.stargazers_count > 5 && pushed <= 90;
      });

      setLoadingStep(`Analysing ${filtered.length} repos with Claude…`);

      // Analyse in batches of 3 to stay within rate limits
      const analysed = [];
      for (let i = 0; i < Math.min(filtered.length, 12); i++) {
        const repo = filtered[i];
        const system =
          'You are a VC analyst at BlackFin Tech, a European FinTech/RegTech/InsurTech specialist fund. Respond ONLY with a valid JSON object, no markdown, no preamble.';
        const prompt = `Is this GitHub repo early-stage work fitting BlackFin VC thesis? (AI-native B2B FinTech/RegTech/InsurTech, EU market, Series A-B potential).

Repo:
- Name: ${repo.full_name}
- Description: ${repo.description || 'none'}
- Stars: ${repo.stargazers_count}
- Topics: ${(repo.topics || []).join(', ')}
- Owner: ${repo.owner?.login}
- Language: ${repo.language}

Output JSON exactly:
{"is_relevant":bool,"company_name":"string","what_it_does":"string","thesis_fit_score":0-100,"regulatory_angle":"string","sourcing_action":"Screen now"|"Monitor"|"Skip"}`;

        try {
          const raw = await claudeAPI(system, prompt, apiKey);
          const parsed = parseJSON(raw);
          if (parsed && parsed.is_relevant) {
            analysed.push({ ...parsed, html_url: repo.html_url, stars: repo.stargazers_count });
          }
        } catch {
          // skip single failures silently
        }
      }

      setResults(analysed.sort((a, b) => b.thesis_fit_score - a.thesis_fit_score));
    } catch (err) {
      setError('GitHub scan failed. Check network or API keys.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const actionColor = (action) => {
    if (action === 'Screen now') return 'bg-green-400/10 border-green-400/20 text-green-400';
    if (action === 'Monitor') return 'bg-amber-400/10 border-amber-400/20 text-amber-400';
    return 'bg-white/5 border-white/10 text-white/40';
  };

  return (
    <div className="bg-navy-2 border border-white/10 rounded-xl p-4 flex flex-col min-h-[340px]">
      <SectionHeader title="GitHub Radar" badge="OSS SIGNALS">
        <PrimaryButton onClick={scanGitHub} disabled={loading}>
          {loading ? (
            <>
              <div className="w-3 h-3 border border-navy/60 border-t-navy rounded-full animate-spin" />
              Scanning…
            </>
          ) : (
            '⬡ Scan GitHub'
          )}
        </PrimaryButton>
      </SectionHeader>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
        {loading && <Spinner label={loadingStep || 'Scanning repositories…'} />}
        {!loading && error && (
          <div className="bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}
        {!loading && !error && results.length === 0 && (
          <EmptyState
            icon="⬡"
            title="No repos scanned yet"
            subtitle="Click Scan GitHub to discover early-stage FinTech & RegTech projects"
          />
        )}
        {!loading &&
          results.map((r, i) => (
            <div
              key={i}
              className="bg-navy-3 border border-white/10 rounded-lg px-3 py-2.5 flex flex-col gap-1.5 transition-colors duration-200 hover:border-gold/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white text-xs font-bold truncate">{r.company_name}</span>
                    <span
                      className={`text-[9px] font-bold tracking-[0.12em] uppercase px-1.5 py-0.5 rounded border ${actionColor(r.sourcing_action)}`}
                    >
                      {r.sourcing_action}
                    </span>
                  </div>
                  <p className="text-white/50 text-[10px] mt-0.5 leading-relaxed line-clamp-2">{r.what_it_does}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`font-mono text-sm font-bold ${scoreColor(r.thesis_fit_score)}`}
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {r.thesis_fit_score}
                  </span>
                  <span className="text-white/25 text-[9px]">fit score</span>
                </div>
              </div>
              {r.regulatory_angle && (
                <p className="text-gold/70 text-[9px] italic border-t border-white/5 pt-1.5">
                  ⚖ {r.regulatory_angle}
                </p>
              )}
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-white/25 text-[9px]">★ {r.stars}</span>
                <a
                  href={r.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold/60 hover:text-gold text-[9px] font-bold tracking-[0.08em] uppercase transition-colors duration-200"
                >
                  View Repo →
                </a>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// ─── SUB-SECTION 2: Competitor Fund Tracker ───────────────────────────────────

const CompetitorFundTracker = ({ apiKey, tvKey }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const FUND_QUERIES = [
    { fund: 'Accel', query: 'Accel portfolio investment fintech regtech insurtech 2026' },
    { fund: 'Index Ventures', query: 'Index Ventures portfolio fintech AI investment 2026' },
    { fund: 'Balderton Capital', query: 'Balderton Capital fintech investment 2026' },
    { fund: 'Notion Capital', query: 'Notion Capital portfolio fintech 2026' },
    { fund: 'Partech', query: 'Partech portfolio fintech regtech 2026' },
  ];

  const signalStyle = (signal) => {
    if (signal === 'CROWDING') return { badge: 'bg-red-400/10 border-red-400/20 text-red-400', dot: 'bg-red-400' };
    if (signal === 'OPPORTUNITY') return { badge: 'bg-green-400/10 border-green-400/20 text-green-400', dot: 'bg-green-400' };
    return { badge: 'bg-white/8 border-white/10 text-white/50', dot: 'bg-white/30' };
  };

  const scan = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const tavilyResults = await Promise.all(
        FUND_QUERIES.map(({ query }) => tavily(query, tvKey).catch(() => ({ results: [] })))
      );

      const analysed = await Promise.all(
        FUND_QUERIES.map(async ({ fund }, idx) => {
          const snippets = (tavilyResults[idx]?.results || [])
            .slice(0, 5)
            .map((r) => `- ${r.title}: ${r.content?.slice(0, 200) || ''}`)
            .join('\n');

          const system =
            'You are a VC intelligence analyst. Respond ONLY with valid JSON, no markdown, no preamble.';
          const prompt = `Analyse ${fund}'s recent investment activity in FinTech/RegTech/InsurTech for 2026.

News snippets:
${snippets || 'No recent news found.'}

BlackFin Tech focuses on: AI-native B2B FinTech, RegTech, InsurTech, EU market.

Output JSON exactly:
{"fund":"${fund}","recent_sectors":["string"],"crowd_sectors":["string"],"opportunity_sectors":["string"],"signal":"CROWDING"|"OPPORTUNITY"|"NEUTRAL","implication":"string"}

Rules: crowd_sectors = sectors with 3+ investments by this fund this year. opportunity_sectors = BlackFin thesis sectors this fund has NOT invested in. signal = CROWDING if they're flooding a BlackFin sector, OPPORTUNITY if they've left a gap, NEUTRAL otherwise.`;

          try {
            const raw = await claudeAPI(system, prompt, apiKey);
            return parseJSON(raw) || { fund, recent_sectors: [], crowd_sectors: [], opportunity_sectors: [], signal: 'NEUTRAL', implication: 'Analysis unavailable.' };
          } catch {
            return { fund, recent_sectors: [], crowd_sectors: [], opportunity_sectors: [], signal: 'NEUTRAL', implication: 'Analysis failed.' };
          }
        })
      );

      setResults(analysed);
    } catch (err) {
      setError('Fund scan failed. Check Tavily API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-navy-2 border border-white/10 rounded-xl p-4 flex flex-col min-h-[340px]">
      <SectionHeader title="Competitor Fund Tracker" badge="MARKET INTEL">
        <PrimaryButton onClick={scan} disabled={loading}>
          {loading ? (
            <>
              <div className="w-3 h-3 border border-navy/60 border-t-navy rounded-full animate-spin" />
              Scanning…
            </>
          ) : (
            '⬡ Scan Funds'
          )}
        </PrimaryButton>
      </SectionHeader>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
        {loading && <Spinner label="Querying fund activity…" />}
        {!loading && error && (
          <div className="bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}
        {!loading && !error && results.length === 0 && (
          <EmptyState
            icon="◈"
            title="No fund data yet"
            subtitle="Scan competitor funds to identify crowding & opportunity signals"
          />
        )}
        {!loading &&
          results.map((r, i) => {
            const style = signalStyle(r.signal);
            return (
              <div
                key={i}
                className="bg-navy-3 border border-white/10 rounded-lg px-3 py-2.5 flex flex-col gap-2 transition-colors duration-200 hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    <span className="text-white text-xs font-bold">{r.fund}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold tracking-[0.12em] uppercase px-2 py-0.5 rounded border ${style.badge}`}
                  >
                    {r.signal}
                  </span>
                </div>

                {r.recent_sectors?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.recent_sectors.slice(0, 4).map((s, j) => (
                      <span
                        key={j}
                        className="text-[9px] text-white/50 bg-white/5 border border-white/8 rounded px-1.5 py-0.5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-white/50 text-[10px] leading-relaxed">{r.implication}</p>

                {r.opportunity_sectors?.length > 0 && (
                  <div className="flex flex-wrap gap-1 border-t border-white/5 pt-1.5">
                    <span className="text-[9px] text-green-400/60 font-bold uppercase tracking-[0.08em] mr-1">Gap:</span>
                    {r.opportunity_sectors.slice(0, 3).map((s, j) => (
                      <span
                        key={j}
                        className="text-[9px] text-green-400/70 bg-green-400/5 border border-green-400/15 rounded px-1.5 py-0.5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

// ─── SUB-SECTION 3: Regulatory Prediction Engine ─────────────────────────────

const RegulatoryEngine = ({ apiKey, tvKey }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const REG_QUERIES = [
    { reg: 'EU AI Act', query: 'EU AI Act enforcement August 2026 financial services' },
    { reg: 'AMLA', query: 'AMLA Anti-Money Laundering Authority EU 2026' },
    { reg: 'PSD3 / PSR', query: 'PSD3 PSR payment services directive 2026 fintech' },
    { reg: 'EU Fin Reg', query: 'EU financial regulation enforcement deadline 2026 startup opportunity' },
  ];

  const tlStyle = (light) => {
    if (light === 'GREEN') return { ring: 'border-green-400/40', dot: 'bg-green-400', text: 'text-green-400' };
    if (light === 'AMBER') return { ring: 'border-amber-400/40', dot: 'bg-amber-400', text: 'text-amber-400' };
    return { ring: 'border-red-400/40', dot: 'bg-red-400', text: 'text-red-400' };
  };

  const urgencyBar = (score) => {
    const w = Math.min(100, Math.max(0, (score / 10) * 100));
    const color = score >= 8 ? 'bg-red-400' : score >= 5 ? 'bg-amber-400' : 'bg-green-400';
    return { w, color };
  };

  const predict = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const tavilyResults = await Promise.all(
        REG_QUERIES.map(({ query }) => tavily(query, tvKey).catch(() => ({ results: [] })))
      );

      const analysed = await Promise.all(
        REG_QUERIES.map(async ({ reg }, idx) => {
          const snippets = (tavilyResults[idx]?.results || [])
            .slice(0, 4)
            .map((r) => `- ${r.title}: ${r.content?.slice(0, 250) || ''}`)
            .join('\n');

          const system =
            'You are a regulatory intelligence analyst for a VC fund. Respond ONLY with valid JSON, no markdown.';
          const prompt = `Analyse the regulatory impact of "${reg}" for EU FinTech startups.

News/context:
${snippets || 'No recent data found. Use general knowledge.'}

Output JSON exactly:
{"regulation":"${reg}","moat_creates":["string"],"moat_destroys":["string"],"timing_months":0,"urgency_score":1-10,"traffic_light":"GREEN"|"AMBER"|"RED","summary":"string"}

Rules:
- moat_creates: 2-4 company types that gain competitive moat from this regulation
- moat_destroys: 2-3 existing moats this regulation threatens
- timing_months: months until major enforcement milestone
- urgency_score: 1=low urgency to 10=imminent critical change
- traffic_light: GREEN=opportunity dominant, AMBER=mixed, RED=risk dominant
- summary: 1-2 sentence takeaway for a VC analyst`;

          try {
            const raw = await claudeAPI(system, prompt, apiKey);
            return parseJSON(raw) || {
              regulation: reg,
              moat_creates: [],
              moat_destroys: [],
              timing_months: 0,
              urgency_score: 5,
              traffic_light: 'AMBER',
              summary: 'Analysis unavailable.',
            };
          } catch {
            return {
              regulation: reg,
              moat_creates: [],
              moat_destroys: [],
              timing_months: 0,
              urgency_score: 5,
              traffic_light: 'AMBER',
              summary: 'Analysis failed.',
            };
          }
        })
      );

      setResults(analysed);
    } catch (err) {
      setError('Regulatory scan failed. Check API keys.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-navy-2 border border-white/10 rounded-xl p-4 flex flex-col min-h-[340px]">
      <SectionHeader title="Regulatory Prediction Engine" badge="EU POLICY">
        <PrimaryButton onClick={predict} disabled={loading}>
          {loading ? (
            <>
              <div className="w-3 h-3 border border-navy/60 border-t-navy rounded-full animate-spin" />
              Analysing…
            </>
          ) : (
            '⬡ Predict Impact'
          )}
        </PrimaryButton>
      </SectionHeader>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
        {loading && <Spinner label="Parsing regulatory signals…" />}
        {!loading && error && (
          <div className="bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}
        {!loading && !error && results.length === 0 && (
          <EmptyState
            icon="⚖"
            title="No regulatory data yet"
            subtitle="Predict which EU regulations create or destroy FinTech moats"
          />
        )}
        {!loading &&
          results.map((r, i) => {
            const tl = tlStyle(r.traffic_light);
            const ub = urgencyBar(r.urgency_score);
            return (
              <div
                key={i}
                className={`bg-navy-3 border rounded-lg px-3 py-2.5 flex flex-col gap-2 transition-colors duration-200 ${tl.ring}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${tl.dot} shadow-[0_0_6px_currentColor]`} />
                    <span className="text-white text-xs font-bold">{r.regulation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.timing_months > 0 && (
                      <span className="text-white/30 text-[9px]">{r.timing_months}mo</span>
                    )}
                    <span
                      className={`text-[9px] font-bold tracking-[0.1em] uppercase ${tl.text}`}
                    >
                      {r.traffic_light}
                    </span>
                  </div>
                </div>

                {/* Urgency bar */}
                <div className="flex items-center gap-2">
                  <span className="text-white/30 text-[9px] w-12 shrink-0">Urgency</span>
                  <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${ub.color}`}
                      style={{ width: `${ub.w}%` }}
                    />
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold ${tl.text}`}
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {r.urgency_score}/10
                  </span>
                </div>

                <p className="text-white/50 text-[10px] leading-relaxed">{r.summary}</p>

                <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-1.5">
                  {r.moat_creates?.length > 0 && (
                    <div>
                      <p className="text-[9px] text-green-400/60 font-bold uppercase tracking-[0.08em] mb-1">Creates moat</p>
                      {r.moat_creates.slice(0, 2).map((m, j) => (
                        <p key={j} className="text-[9px] text-white/40 leading-relaxed">+ {m}</p>
                      ))}
                    </div>
                  )}
                  {r.moat_destroys?.length > 0 && (
                    <div>
                      <p className="text-[9px] text-red-400/60 font-bold uppercase tracking-[0.08em] mb-1">Destroys moat</p>
                      {r.moat_destroys.slice(0, 2).map((m, j) => (
                        <p key={j} className="text-[9px] text-white/40 leading-relaxed">− {m}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

// ─── SUB-SECTION 4: Market Signal Feed ───────────────────────────────────────

const MarketSignalFeed = ({ apiKey, tvKey }) => {
  const [loading, setLoading] = useState(false);
  const [signals, setSignals] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const SIGNAL_QUERIES = [
    'EU FinTech RegTech startup launch new company 2026',
    'European fintech funding round Series A 2026',
    'AI compliance regtech startup Europe 2026',
    'insurtech startup EU launch 2026',
    'embedded finance banking-as-a-service Europe 2026',
  ];

  const SIGNAL_LABELS = [
    'New Entrants',
    'Funding Activity',
    'AI Compliance',
    'InsurTech',
    'Embedded Finance',
  ];

  const categoryColor = (idx) => {
    const colors = [
      'text-gold border-gold/20 bg-gold/8',
      'text-green-400 border-green-400/20 bg-green-400/8',
      'text-blue-400 border-blue-400/20 bg-blue-400/8',
      'text-purple-400 border-purple-400/20 bg-purple-400/8',
      'text-cyan-400 border-cyan-400/20 bg-cyan-400/8',
    ];
    return colors[idx % colors.length];
  };

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const tavilyResults = await Promise.all(
        SIGNAL_QUERIES.map((query) => tavily(query, tvKey).catch(() => ({ results: [] })))
      );

      // Flatten & deduplicate by URL, then ask Claude to synthesize each category
      const allSignals = [];

      await Promise.all(
        tavilyResults.map(async (res, idx) => {
          const articles = (res?.results || []).slice(0, 4);
          if (!articles.length) return;

          const snippets = articles
            .map((a) => `- ${a.title}: ${a.content?.slice(0, 200) || ''} [${a.url || ''}]`)
            .join('\n');

          const system =
            'You are a VC market intelligence analyst. Respond ONLY with valid JSON array, no markdown.';
          const prompt = `Extract 2-3 key market signals from these news items for a FinTech/RegTech VC fund.

Category: ${SIGNAL_LABELS[idx]}
Articles:
${snippets}

Output a JSON array:
[{"headline":"string","signal_type":"LAUNCH"|"FUNDING"|"REGULATION"|"M&A"|"TREND","relevance":"HIGH"|"MEDIUM"|"LOW","insight":"string","source_url":"string"}]

Rules:
- headline: concise 8-word max title
- insight: 1-sentence VC-relevant takeaway
- Only include items relevant to EU FinTech/RegTech/InsurTech thesis`;

          try {
            const raw = await claudeAPI(system, prompt, apiKey);
            const parsed = parseJSONArray(raw);
            if (parsed) {
              parsed.forEach((s) => allSignals.push({ ...s, category: SIGNAL_LABELS[idx], categoryIdx: idx }));
            }
          } catch {
            // skip
          }
        })
      );

      // Sort: HIGH first, then MEDIUM, LOW
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      allSignals.sort((a, b) => (order[a.relevance] ?? 2) - (order[b.relevance] ?? 2));

      setSignals(allSignals);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Market signal scan failed.');
    } finally {
      setLoading(false);
    }
  }, [apiKey, tvKey]);

  // Auto-run on mount
  useEffect(() => {
    if (tvKey && apiKey) {
      scan();
    }
  }, []);

  const signalTypeIcon = (type) => {
    const icons = { LAUNCH: '🚀', FUNDING: '💰', REGULATION: '⚖', 'M&A': '🤝', TREND: '📈' };
    return icons[type] || '●';
  };

  const relevanceBadge = (rel) => {
    if (rel === 'HIGH') return 'bg-green-400/10 border-green-400/20 text-green-400';
    if (rel === 'MEDIUM') return 'bg-amber-400/10 border-amber-400/20 text-amber-400';
    return 'bg-white/5 border-white/10 text-white/40';
  };

  const fmtTime = (d) =>
    d
      ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '';

  return (
    <div className="bg-navy-2 border border-white/10 rounded-xl p-4 flex flex-col min-h-[340px]">
      <SectionHeader
        title="Market Signal Feed"
        badge={lastUpdated ? `Updated ${fmtTime(lastUpdated)}` : 'LIVE FEED'}
      >
        <PrimaryButton onClick={scan} disabled={loading}>
          {loading ? (
            <>
              <div className="w-3 h-3 border border-navy/60 border-t-navy rounded-full animate-spin" />
              Scanning…
            </>
          ) : (
            '⬡ Scan Signals'
          )}
        </PrimaryButton>
      </SectionHeader>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-hide">
        {loading && <Spinner label="Aggregating market signals…" />}
        {!loading && error && (
          <div className="bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}
        {!loading && !error && signals.length === 0 && (
          <EmptyState
            icon="📡"
            title="Auto-scanning on load"
            subtitle="Live market signals across EU FinTech, RegTech, InsurTech"
          />
        )}
        {!loading &&
          signals.map((s, i) => (
            <div
              key={i}
              className="bg-navy-3 border border-white/8 rounded-lg px-3 py-2 flex gap-2.5 transition-colors duration-200 hover:border-white/15"
            >
              <span className="text-base leading-none mt-0.5 shrink-0">{signalTypeIcon(s.signal_type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1.5 mb-0.5">
                  <p className="text-white text-[10px] font-bold leading-snug">{s.headline}</p>
                  <span
                    className={`text-[9px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded border shrink-0 ${relevanceBadge(s.relevance)}`}
                  >
                    {s.relevance}
                  </span>
                </div>
                <p className="text-white/40 text-[10px] leading-relaxed">{s.insight}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[9px] font-bold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded border ${categoryColor(s.categoryIdx)}`}
                  >
                    {s.category}
                  </span>
                  {s.source_url && (
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/25 hover:text-gold/60 text-[9px] transition-colors duration-200 truncate max-w-[120px]"
                    >
                      {(() => {
                        try { return new URL(s.source_url).hostname; } catch { return 'source'; }
                      })()}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// ─── Main IntelligenceEngine Component ───────────────────────────────────────

const IntelligenceEngine = ({ apiKey, tvKey }) => {
  return (
    <div className="w-full">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gold rounded-full" />
          <h2 className="text-white text-sm font-bold tracking-[0.08em] uppercase">
            Intelligence Engine
          </h2>
        </div>
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-gold/60">
          4 Active Modules
        </span>
      </div>

      {/* 2×2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GitHubRadar apiKey={apiKey} />
        <CompetitorFundTracker apiKey={apiKey} tvKey={tvKey} />
        <RegulatoryEngine apiKey={apiKey} tvKey={tvKey} />
        <MarketSignalFeed apiKey={apiKey} tvKey={tvKey} />
      </div>
    </div>
  );
};

export default IntelligenceEngine;
