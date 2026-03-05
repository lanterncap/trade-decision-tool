import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================
const SUPABASE_URL = 'https://artovozlajxjhqjentph.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFydG92b3psYWp4amhxamVudHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTAzNjIsImV4cCI6MjA4NDg2NjM2Mn0.bnfx9qIQwchUwWfYMa_jcYcyqvXVTBQaY17JST8lvfA';
const FINNHUB_API_KEY = 'd5qopgpr01qhn30h1420d5qopgpr01qhn30h142g';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Font injection
if (!document.getElementById('lc-fonts')) {
  const s = document.createElement('style');
  s.id = 'lc-fonts';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; background: #07101f; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
    input, textarea, select, button { font-family: 'DM Sans', sans-serif; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1a2d45; border-radius: 2px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes glow { 0%,100% { box-shadow: 0 0 12px rgba(201,168,76,0.15); } 50% { box-shadow: 0 0 28px rgba(201,168,76,0.4); } }
  `;
  document.head.appendChild(s);
}

// ============================================================================
// THEME
// ============================================================================
const C = {
  bg:          '#07101f',
  surface:     '#0d1829',
  card:        '#0f1e30',
  border:      '#1a2d45',
  gold:        '#c9a84c',
  goldLight:   '#d4b96a',
  goldDim:     'rgba(201,168,76,0.10)',
  goldBorder:  'rgba(201,168,76,0.28)',
  success:     '#10b981',
  successDim:  'rgba(16,185,129,0.12)',
  danger:      '#ef4444',
  dangerDim:   'rgba(239,68,68,0.12)',
  warning:     '#f59e0b',
  warningDim:  'rgba(245,158,11,0.12)',
  blue:        '#3b82f6',
  blueDim:     'rgba(59,130,246,0.12)',
  text:        '#e2e8f0',
  textDim:     '#94a3b8',
  muted:       '#4a6080',
  white:       '#ffffff',
};
const mono  = { fontFamily: "'JetBrains Mono', monospace" };
const serif = { fontFamily: "'Playfair Display', serif" };

// ============================================================================
// SCORING ENGINE  —  multiplicative model
// Formula: position% = (F1 × F2 × F3 × F4 × F5) / 5^5
// Any factor = 0 → position = 0 (hard veto)
// ============================================================================
const FACTORS = [
  {
    id: 'industry_trend',
    label: 'Industry Trend',
    abbr: 'IT',
    description: 'Business cycle stage & sector momentum',
    hints: [
      { label: 'VETO',        text: 'Wrong cycle phase — sector in confirmed downtrend' },
      { label: 'WEAK',        text: 'Late cycle, sector losing momentum, fading interest' },
      { label: 'MIXED',       text: 'Mid-cycle, unclear sector direction' },
      { label: 'OK',          text: 'Early-mid cycle, sector trend developing positively' },
      { label: 'STRONG',      text: 'Clear sector uptrend, good cycle timing' },
      { label: 'IDEAL',       text: 'Perfect entry — early cycle, sector breaking out' },
    ],
  },
  {
    id: 'company_quality',
    label: 'Company Quality',
    abbr: 'CQ',
    description: 'Project quality, management & business model',
    hints: [
      { label: 'VETO',        text: 'Poor assets, weak management, thesis broken' },
      { label: 'POOR',        text: 'Marginal project, unproven team' },
      { label: 'FAIR',        text: 'Average project, standard management' },
      { label: 'GOOD',        text: 'Solid project, competent and aligned team' },
      { label: 'STRONG',      text: 'High-grade asset, experienced operators' },
      { label: 'WORLD-CLASS', text: 'Tier-1 asset, proven management, underfollowed' },
    ],
  },
  {
    id: 'personal_edge',
    label: 'Personal Edge',
    abbr: 'PE',
    description: 'Your knowledge depth of sector & company',
    hints: [
      { label: 'VETO',        text: 'Never studied this space — do not trade what you cannot value' },
      { label: 'MINIMAL',     text: 'Surface-level only, mostly headlines' },
      { label: 'SOME',        text: 'General sector knowledge, basic DD done' },
      { label: 'SOLID',       text: 'Sector familiar, thorough company research done' },
      { label: 'STRONG',      text: 'Deep sector expertise, know the story well' },
      { label: 'EXPERT',      text: 'Top-of-sector knowledge, know management personally' },
    ],
  },
  {
    id: 'technical_setup',
    label: 'Technical Setup',
    abbr: 'TS',
    description: 'Chart structure & Elliott Wave entry point',
    hints: [
      { label: 'VETO',        text: 'Broken structure, falling knife — no entry' },
      { label: 'POOR',        text: 'No clear setup, entering blind' },
      { label: 'WEAK',        text: 'Some structure but uncertain entry' },
      { label: 'DECENT',      text: 'Clear wave count, acceptable entry point' },
      { label: 'GOOD',        text: 'Textbook setup — wave 3 or clean pullback' },
      { label: 'PERFECT',     text: 'Ideal entry — wave 3 of 3, breakout on volume' },
    ],
  },
  {
    id: 'downside_protection',
    label: 'Downside Protection',
    abbr: 'DP',
    description: 'Cash position, floor price & placement proximity',
    hints: [
      { label: 'VETO',        text: 'No cash runway, far above all-time lows' },
      { label: 'POOR',        text: 'Limited cash, well above floor, high dilution risk' },
      { label: 'SOME',        text: 'Some cash, reasonable distance above floor' },
      { label: 'OK',          text: 'Adequate cash, near recent placement price' },
      { label: 'STRONG',      text: 'Well-funded, buying at or near floor price' },
      { label: 'MAXIMUM',     text: 'Fully funded, at or below last placement price' },
    ],
  },
];

const MAX_PRODUCT = Math.pow(5, 5); // 3125

function computeScore(factors) {
  const vals = FACTORS.map(f => factors[f.id]);
  const allScored = vals.every(v => v !== undefined);
  const hasZero = vals.some(v => v === 0);
  const product = allScored && !hasZero ? vals.reduce((a, v) => a * v, 1) : 0;
  const pct = allScored && !hasZero ? (product / MAX_PRODUCT) * 100 : 0;
  const sizeK = Math.round(pct * 10) / 10; // $K (100% = $100K)
  return { vals, allScored, hasZero, product, pct, sizeK };
}

function getDecision(pct, hasZero) {
  if (hasZero || pct === 0) return { text: 'NO TRADE',       color: C.danger,  bg: C.dangerDim  };
  if (pct < 8)              return { text: 'MARGINAL',        color: C.muted,   bg: 'rgba(74,96,128,0.1)' };
  if (pct < 20)             return { text: 'LOW',             color: C.warning, bg: C.warningDim };
  if (pct < 40)             return { text: 'MEDIUM',          color: C.blue,    bg: C.blueDim    };
  if (pct < 65)             return { text: 'HIGH CONVICTION', color: C.success, bg: C.successDim };
  return                           { text: 'MAXIMUM',         color: C.gold,    bg: C.goldDim    };
}

function scoreColor(v) {
  if (v === undefined) return C.border;
  if (v === 0) return C.danger;
  if (v === 1) return '#f97316';
  if (v === 2) return C.warning;
  if (v === 3) return C.blue;
  if (v === 4) return C.success;
  return C.gold;
}

// ============================================================================
// FINNHUB
// ============================================================================
async function fetchStockQuote(symbol) {
  try {
    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    const d = await r.json();
    if (d.c) return { current: d.c, change: d.d, changePercent: d.dp, high: d.h, low: d.l, open: d.o, prevClose: d.pc };
  } catch {}
  return null;
}
async function fetchStockNews(symbol) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const r = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${weekAgo}&to=${today}&token=${FINNHUB_API_KEY}`);
    return (await r.json()).slice(0, 5);
  } catch { return []; }
}
async function searchSymbol(query) {
  try {
    const r = await fetch(`https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_API_KEY}`);
    return (await r.json()).result?.slice(0, 10) || [];
  } catch { return []; }
}

// ============================================================================
// SHARED UI
// ============================================================================
function Logo({ size = 'default' }) {
  const [iconSz, textSz, subSz] = { small: [28,14,9], default: [38,20,10], large: [50,26,12] }[size];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: iconSz, height: iconSz, background: `linear-gradient(135deg, ${C.gold} 0%, #9a6e20 100%)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 14px rgba(201,168,76,0.3)', flexShrink: 0 }}>
        <svg width={iconSz * 0.55} height={iconSz * 0.55} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke={C.bg} strokeWidth="2"/>
          <path d="M12 6L8 8.5V13.5L12 16L16 13.5V8.5L12 6Z" fill={C.bg}/>
        </svg>
      </div>
      <div>
        <div style={{ ...serif, fontSize: textSz, fontWeight: 700, color: C.white, letterSpacing: '0.03em', lineHeight: 1 }}>LANTERN</div>
        <div style={{ fontSize: subSz, color: C.gold, letterSpacing: '0.15em', fontWeight: 500, marginTop: 3 }}>CAPITAL ADVISORS</div>
      </div>
    </div>
  );
}

function Header({ title, onBack }) {
  return (
    <div style={{ background: C.surface, padding: '14px 20px', paddingTop: 'max(14px, env(safe-area-inset-top))', position: 'sticky', top: 0, zIndex: 100, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {onBack
          ? <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.textDim, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>← Back</button>
          : <div style={{ width: 70 }} />}
        <Logo size="small" />
        <div style={{ width: 70 }} />
      </div>
      {title && (
        <div style={{ textAlign: 'center', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 11, color: C.textDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title}</span>
        </div>
      )}
    </div>
  );
}

function SyncBadge({ status }) {
  const cfg = {
    synced:  { color: C.success, bg: C.successDim, dot: '●', text: 'Synced'  },
    syncing: { color: C.warning, bg: C.warningDim, dot: '↻', text: 'Syncing' },
    offline: { color: C.muted,   bg: 'transparent', dot: '○', text: 'Offline' },
    error:   { color: C.danger,  bg: C.dangerDim,  dot: '✕', text: 'Error'   },
  }[status] || { color: C.muted, bg: 'transparent', dot: '○', text: 'Offline' };
  return (
    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: cfg.bg, color: cfg.color, fontWeight: 600, letterSpacing: '0.04em', ...mono }}>
      {cfg.dot} {cfg.text}
    </span>
  );
}

function Empty({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: 48, background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 28, color: C.muted, marginBottom: 10, ...mono }}>{icon}</div>
      <div style={{ fontWeight: 500, color: C.muted, fontSize: 14 }}>{text}</div>
    </div>
  );
}

// ============================================================================
// AUTH
// ============================================================================
function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setMsg('');
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg('Check your email to confirm your account'); setMode('login');
      }
    } catch (err) { setMsg(err.message); }
    setLoading(false);
  };

  const inp = { width: '100%', padding: '13px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 15, color: C.text, outline: 'none', marginBottom: 10 };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><Logo size="large" /></div>
          <div style={{ width: 80, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, margin: '0 auto' }} />
        </div>
        <div style={{ background: C.card, borderRadius: 16, padding: 28, border: `1px solid ${C.border}` }}>
          <h2 style={{ ...serif, margin: '0 0 22px', fontSize: 22, color: C.white, textAlign: 'center' }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <form onSubmit={submit}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inp} required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inp, marginBottom: 14 }} required minLength={6} />
            {msg && (
              <div style={{ padding: 10, background: msg.includes('Check') ? C.successDim : C.dangerDim, border: `1px solid ${msg.includes('Check') ? C.success : C.danger}`, borderRadius: 8, marginBottom: 14, fontSize: 13, color: msg.includes('Check') ? C.success : C.danger }}>
                {msg}
              </div>
            )}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: C.gold, color: C.bg, border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ width: '100%', marginTop: 14, background: 'none', border: 'none', color: C.goldLight, fontSize: 13, cursor: 'pointer', opacity: 0.8 }}>
            {mode === 'login' ? "No account? Sign up" : 'Have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FACTOR CARD
// ============================================================================
function FactorCard({ factor, value, onChange }) {
  const hint = value !== undefined ? factor.hints[value] : null;
  return (
    <div style={{
      background: C.card, borderRadius: 12, marginBottom: 12,
      border: `1px solid ${value === 0 ? C.danger : value === 5 ? C.goldBorder : C.border}`,
      overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      <div style={{ padding: '14px 16px 12px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1, marginRight: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{factor.label}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{factor.description}</div>
          </div>
          <div style={{
            ...mono, fontSize: 26, fontWeight: 700,
            color: value !== undefined ? scoreColor(value) : C.border,
            lineHeight: 1, minWidth: 28, textAlign: 'right',
            transition: 'color 0.2s',
          }}>
            {value !== undefined ? value : '·'}
          </div>
        </div>

        {/* Score buttons 0–5 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
          {[0, 1, 2, 3, 4, 5].map(n => {
            const isSelected = value === n;
            const col = scoreColor(n);
            return (
              <button key={n} onClick={() => onChange(n)} style={{
                padding: '10px 4px', borderRadius: 7,
                border: isSelected ? `2px solid ${col}` : `1px solid ${C.border}`,
                background: isSelected ? `${col}20` : C.surface,
                color: isSelected ? col : C.muted,
                fontSize: 15, fontWeight: isSelected ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.12s',
                ...mono,
              }}>{n}</button>
            );
          })}
        </div>

        {/* Hint */}
        {hint && (
          <div style={{ marginTop: 10, padding: '8px 11px', background: `${scoreColor(value)}12`, borderRadius: 6, borderLeft: `3px solid ${scoreColor(value)}`, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: scoreColor(value), ...mono, whiteSpace: 'nowrap', marginTop: 2 }}>{hint.label}</span>
            <span style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>{hint.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FORMULA BAR (fixed bottom of scorecard)
// ============================================================================
function FormulaBar({ vals, product, pct, sizeK, allScored, hasZero, canSave, saving, onSave }) {
  const decision = getDecision(pct, hasZero);

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: C.surface, borderTop: `1px solid ${C.border}`,
      padding: '14px 16px', paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
      boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', zIndex: 200,
    }}>
      {/* Multiplication formula */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
        {FACTORS.map((f, i) => {
          const v = vals[i];
          return (
            <React.Fragment key={f.id}>
              <span style={{ ...mono, fontSize: 20, fontWeight: 700, color: v !== undefined ? scoreColor(v) : C.border, minWidth: 18, textAlign: 'center', lineHeight: 1, transition: 'color 0.2s' }}>
                {v !== undefined ? v : '·'}
              </span>
              {i < FACTORS.length - 1 && <span style={{ color: C.muted, fontSize: 12, ...mono }}>×</span>}
            </React.Fragment>
          );
        })}
        <span style={{ color: C.muted, fontSize: 12, ...mono, marginLeft: 4 }}>
          {'= '}
          <span style={{ color: allScored ? (hasZero ? C.danger : C.text) : C.border, fontWeight: 700 }}>
            {allScored ? product : '?'}
          </span>
          <span style={{ color: C.muted }}>{` / ${MAX_PRODUCT}`}</span>
        </span>
      </div>

      {/* Result row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasZero && allScored ? 8 : 10 }}>
        <div>
          {allScored && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ ...mono, fontSize: 30, fontWeight: 700, color: decision.color, lineHeight: 1 }}>
                {pct > 0 ? `${pct.toFixed(1)}%` : '0%'}
              </span>
              <span style={{ fontSize: 11, color: C.muted }}>of max</span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: decision.color, letterSpacing: '0.08em' }}>
            {allScored ? decision.text : '—'}
          </div>
          {pct > 0 && (
            <div style={{ ...mono, fontSize: 20, fontWeight: 700, color: C.text }}>${sizeK.toFixed(1)}K</div>
          )}
        </div>
      </div>

      {/* Zero warning */}
      {hasZero && allScored && (
        <div style={{ padding: '7px 11px', background: C.dangerDim, border: `1px solid ${C.danger}40`, borderRadius: 6, marginBottom: 10, fontSize: 12, color: C.danger, textAlign: 'center' }}>
          A zero on any factor vetoes the trade. Raise all factors above 0 to size a position.
        </div>
      )}

      <button onClick={onSave} disabled={!canSave || saving} style={{
        width: '100%', padding: 14,
        background: canSave ? C.gold : C.border,
        color: canSave ? C.bg : C.muted,
        border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
        cursor: canSave && !saving ? 'pointer' : 'not-allowed',
        transition: 'background 0.2s', ...mono,
        letterSpacing: '0.04em',
      }}>
        {saving ? 'SAVING...'
          : !allScored ? 'SCORE ALL FACTORS TO CONTINUE'
          : !canSave ? 'ENTER TICKER TO SAVE'
          : `SAVE  →  $${sizeK.toFixed(1)}K`}
      </button>
    </div>
  );
}

// ============================================================================
// SCORECARD
// ============================================================================
function Scorecard({ onLog, onCancel }) {
  const [factors, setFactors] = useState({});
  const [tradeInfo, setTradeInfo] = useState({ ticker: '', entry: '', stop: '', target: '', thesis: '' });
  const [saving, setSaving] = useState(false);

  const { vals, allScored, hasZero, product, pct, sizeK } = computeScore(factors);
  const canSave = allScored && !hasZero && !!tradeInfo.ticker.trim();

  const handleLog = async () => {
    if (!tradeInfo.ticker.trim()) { alert('Enter a ticker symbol'); return; }
    setSaving(true);
    const decision = getDecision(pct, hasZero);
    await onLog({
      date: new Date().toISOString().split('T')[0],
      ticker: tradeInfo.ticker.trim().toUpperCase(),
      type: 'MULT',
      score: parseFloat(pct.toFixed(2)),
      decision: decision.text,
      suggested_size: `$${sizeK.toFixed(1)}K`,
      planned_entry:  tradeInfo.entry  ? parseFloat(tradeInfo.entry)  : null,
      planned_stop:   tradeInfo.stop   ? parseFloat(tradeInfo.stop)   : null,
      planned_target: tradeInfo.target ? parseFloat(tradeInfo.target) : null,
      thesis: tradeInfo.thesis,
      factor_scores: JSON.stringify(factors),
      executed: false,
    });
    setSaving(false);
  };

  const inp = { padding: '11px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, width: '100%', outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 230 }}>
      <Header title="Score a Trade" onBack={onCancel} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>

        {/* Trade details */}
        <div style={{ background: C.card, borderRadius: 12, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.gold, letterSpacing: '0.12em', fontWeight: 600, marginBottom: 12 }}>TRADE DETAILS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input placeholder="TICKER *" value={tradeInfo.ticker} onChange={e => setTradeInfo(p => ({ ...p, ticker: e.target.value.toUpperCase() }))} style={{ ...inp, ...mono, fontWeight: 700, gridColumn: 'span 2' }} />
            <input type="number" placeholder="Entry Price" value={tradeInfo.entry}  onChange={e => setTradeInfo(p => ({ ...p, entry:  e.target.value }))} style={inp} />
            <input type="number" placeholder="Stop Price"  value={tradeInfo.stop}   onChange={e => setTradeInfo(p => ({ ...p, stop:   e.target.value }))} style={inp} />
            <input type="number" placeholder="Target"      value={tradeInfo.target} onChange={e => setTradeInfo(p => ({ ...p, target: e.target.value }))} style={{ ...inp, gridColumn: 'span 2' }} />
          </div>
          <textarea placeholder="Investment thesis..." value={tradeInfo.thesis} onChange={e => setTradeInfo(p => ({ ...p, thesis: e.target.value }))} style={{ ...inp, marginTop: 8, resize: 'none', minHeight: 64, lineHeight: 1.5, width: '100%' }} />
        </div>

        {/* Model explanation */}
        <div style={{ background: C.goldDim, border: `1px solid ${C.goldBorder}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.goldLight, lineHeight: 1.7 }}>
            Rate each factor <span style={{ ...mono, fontWeight: 700 }}>0–5</span>. &nbsp;
            Position = <span style={{ ...mono, fontWeight: 700 }}>F1 × F2 × F3 × F4 × F5 ÷ 3125 × $100K</span>. &nbsp;
            Any zero vetoes the trade entirely.
          </div>
        </div>

        {/* Factor cards */}
        {FACTORS.map(factor => (
          <FactorCard key={factor.id} factor={factor} value={factors[factor.id]} onChange={val => setFactors(p => ({ ...p, [factor.id]: val }))} />
        ))}
      </div>

      <FormulaBar vals={vals} product={product} pct={pct} sizeK={sizeK} allScored={allScored} hasZero={hasZero} canSave={canSave} saving={saving} onSave={handleLog} />
    </div>
  );
}

// ============================================================================
// FACTOR PILLS (journal display)
// ============================================================================
function FactorPills({ factorScores }) {
  if (!factorScores) return null;
  let parsed = {};
  try { parsed = typeof factorScores === 'string' ? JSON.parse(factorScores) : factorScores; } catch { return null; }
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
      {FACTORS.map(f => {
        const v = parsed[f.id];
        if (v === undefined) return null;
        return (
          <span key={f.id} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${scoreColor(v)}18`, color: scoreColor(v), fontWeight: 700, ...mono }}>
            {f.abbr} {v}
          </span>
        );
      })}
    </div>
  );
}

// ============================================================================
// WATCHLIST
// ============================================================================
function Watchlist({ watchlist, onAdd, onUpdate, onRemove, onBack }) {
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [quotes, setQuotes] = useState({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [selected, setSelected] = useState(null);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => { if (watchlist.length > 0) loadQuotes(); }, [watchlist]);

  const loadQuotes = async () => {
    setLoadingQuotes(true);
    const q = {};
    for (const item of watchlist) { const qt = await fetchStockQuote(item.ticker); if (qt) q[item.ticker] = qt; }
    setQuotes(q); setLoadingQuotes(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults(await searchSymbol(searchQuery));
    setSearching(false);
  };

  const handleAdd = async (symbol, description) => {
    await onAdd({ ticker: symbol, name: description, alert_above: null, alert_below: null, notes: '' });
    setShowAdd(false); setSearchQuery(''); setSearchResults([]);
  };

  const handleViewDetails = async (item) => {
    setSelected(item); setLoadingNews(true);
    setNews(await fetchStockNews(item.ticker));
    setLoadingNews(false);
  };

  if (selected) return <WatchlistDetail item={selected} quote={quotes[selected.ticker]} news={news} loadingNews={loadingNews} onBack={() => setSelected(null)} onUpdate={onUpdate} onRemove={onRemove} />;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Header title="Watchlist" onBack={onBack} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setShowAdd(true)} style={{ flex: 1, padding: 13, background: C.gold, color: C.bg, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Add Ticker</button>
          <button onClick={loadQuotes} disabled={loadingQuotes} style={{ padding: '13px 18px', background: C.card, color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 16, cursor: 'pointer' }}>↻</button>
        </div>

        {showAdd && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: C.card, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400, maxHeight: '75vh', overflow: 'auto', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Add Ticker</span>
                <button onClick={() => { setShowAdd(false); setSearchResults([]); setSearchQuery(''); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 26, cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input type="text" placeholder="Symbol or name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value.toUpperCase())} onKeyPress={e => e.key === 'Enter' && handleSearch()} style={{ flex: 1, padding: 11, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, outline: 'none' }} />
                <button onClick={handleSearch} disabled={searching} style={{ padding: '11px 16px', background: C.gold, color: C.bg, border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>{searching ? '...' : 'Go'}</button>
              </div>
              {searchResults.map((r, i) => (
                <div key={i} onClick={() => handleAdd(r.symbol, r.description)} style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}>
                  <div style={{ fontWeight: 600, color: C.text, ...mono }}>{r.symbol}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{r.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {watchlist.length === 0 ? (
          <Empty icon="◎" text="Watchlist is empty" />
        ) : watchlist.map(item => {
          const q = quotes[item.ticker];
          const hasAlert = (item.alert_above && q?.current >= item.alert_above) || (item.alert_below && q?.current <= item.alert_below);
          return (
            <div key={item.id} onClick={() => handleViewDetails(item)} style={{ background: C.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${hasAlert ? C.warning : C.border}`, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...mono, fontSize: 16, fontWeight: 700, color: C.text }}>{item.ticker}</span>
                    {hasAlert && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: C.warningDim, color: C.warning, fontWeight: 700 }}>ALERT</span>}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.name}</div>
                </div>
                {q
                  ? <div style={{ textAlign: 'right' }}>
                      <div style={{ ...mono, fontSize: 16, fontWeight: 700, color: C.text }}>${q.current.toFixed(2)}</div>
                      <div style={{ ...mono, fontSize: 12, color: q.changePercent >= 0 ? C.success : C.danger, fontWeight: 600 }}>{q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%</div>
                    </div>
                  : <div style={{ fontSize: 12, color: C.muted }}>Loading...</div>}
              </div>
              {(item.alert_above || item.alert_below) && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, fontSize: 11 }}>
                  {item.alert_above && <span style={{ padding: '2px 7px', background: C.surface, borderRadius: 4, color: C.textDim, ...mono }}>▲ ${item.alert_above}</span>}
                  {item.alert_below && <span style={{ padding: '2px 7px', background: C.surface, borderRadius: 4, color: C.textDim, ...mono }}>▼ ${item.alert_below}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WatchlistDetail({ item, quote, news, loadingNews, onBack, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ ...item });

  const handleSave = async () => {
    await onUpdate({ ...editData, alert_above: editData.alert_above ? parseFloat(editData.alert_above) : null, alert_below: editData.alert_below ? parseFloat(editData.alert_below) : null });
    setEditing(false);
  };

  const inp = { width: '100%', padding: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, color: C.text, outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <Header title={item.ticker} onBack={onBack} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Quote card */}
        <div style={{ background: C.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{item.name}</div>
          {quote ? (
            <>
              <div style={{ ...mono, fontSize: 34, fontWeight: 700, color: C.text }}>${quote.current.toFixed(2)}</div>
              <div style={{ ...mono, fontSize: 14, color: quote.changePercent >= 0 ? C.success : C.danger, fontWeight: 600, marginTop: 2 }}>
                {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: 11, paddingTop: 12, marginTop: 12, borderTop: `1px solid ${C.border}` }}>
                {[['Open', quote.open], ['High', quote.high], ['Low', quote.low], ['Prev', quote.prevClose]].map(([l, v]) => (
                  <div key={l}><span style={{ color: C.muted }}>{l}</span><br /><strong style={{ ...mono }}>${v?.toFixed(2)}</strong></div>
                ))}
              </div>
            </>
          ) : <div style={{ color: C.muted, padding: '8px 0' }}>Loading...</div>}
        </div>

        {/* Alerts */}
        <div style={{ background: C.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 10, color: C.gold, letterSpacing: '0.12em', fontWeight: 600 }}>PRICE ALERTS</span>
            {!editing && <button onClick={() => setEditing(true)} style={{ fontSize: 12, color: C.goldLight, background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>}
          </div>
          {editing ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: C.muted }}>Alert Above ($)</label><input type="number" value={editData.alert_above || ''} onChange={e => setEditData(p => ({ ...p, alert_above: e.target.value }))} style={{ ...inp, marginTop: 4 }} /></div>
                <div><label style={{ fontSize: 10, color: C.muted }}>Alert Below ($)</label><input type="number" value={editData.alert_below || ''} onChange={e => setEditData(p => ({ ...p, alert_below: e.target.value }))} style={{ ...inp, marginTop: 4 }} /></div>
              </div>
              <textarea value={editData.notes || ''} onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))} placeholder="Notes..." style={{ ...inp, minHeight: 60, resize: 'none', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSave} style={{ flex: 1, padding: 11, background: C.gold, color: C.bg, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>Save</button>
                <button onClick={() => { setEditing(false); setEditData({ ...item }); }} style={{ flex: 1, padding: 11, background: C.surface, color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['Alert Above', item.alert_above], ['Alert Below', item.alert_below]].map(([l, v]) => (
                  <div key={l} style={{ flex: 1, padding: 10, background: C.surface, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                    <div style={{ ...mono, fontSize: 14, fontWeight: 600, color: C.text, marginTop: 2 }}>{v ? `$${v}` : '—'}</div>
                  </div>
                ))}
              </div>
              {item.notes && <div style={{ fontSize: 12, color: C.textDim, padding: 10, background: C.surface, borderRadius: 6, marginTop: 8 }}>{item.notes}</div>}
            </div>
          )}
        </div>

        {/* News */}
        <div style={{ background: C.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.gold, letterSpacing: '0.12em', fontWeight: 600, marginBottom: 12 }}>RECENT NEWS</div>
          {loadingNews
            ? <div style={{ textAlign: 'center', padding: 20, color: C.muted }}>Loading...</div>
            : news.length === 0
              ? <div style={{ textAlign: 'center', padding: 20, color: C.muted, fontSize: 13 }}>No recent news</div>
              : news.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px 0', borderBottom: i < news.length - 1 ? `1px solid ${C.border}` : 'none', textDecoration: 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 4, lineHeight: 1.4 }}>{a.headline}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{a.source} · {new Date(a.datetime * 1000).toLocaleDateString()}</div>
                </a>
              ))}
        </div>

        <button onClick={async () => { if (confirm(`Remove ${item.ticker} from watchlist?`)) { await onRemove(item.id); onBack(); } }} style={{ width: '100%', padding: 13, background: C.dangerDim, color: C.danger, border: `1px solid ${C.danger}30`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Remove from Watchlist
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// JOURNAL ENTRIES
// ============================================================================
function PendingEntry({ entry, onUpdate, onExecute, onSkip, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execData, setExecData] = useState({ actualSize: '', actualEntry: '' });

  const handleExecute = async () => {
    if (!execData.actualSize || !execData.actualEntry) { alert('Fill in position size and entry price'); return; }
    await onExecute(entry.id, { actual_size: parseFloat(execData.actualSize), actual_entry: parseFloat(execData.actualEntry), executed: true });
    setExecuting(false);
  };

  const inp = { width: '100%', padding: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, color: C.text, outline: 'none' };

  return (
    <div style={{ background: C.card, borderRadius: 12, marginBottom: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
      <div onClick={() => !executing && setExpanded(!expanded)} style={{ padding: 14, cursor: 'pointer', borderLeft: `3px solid ${C.warning}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ ...mono, fontSize: 17, fontWeight: 700, color: C.text }}>{entry.ticker}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: C.warningDim, color: C.warning, fontWeight: 700 }}>PENDING</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{entry.date} · {parseFloat(entry.score || 0).toFixed(1)}% · {entry.decision}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: C.text }}>{entry.suggested_size}</div>
            <div style={{ fontSize: 10, color: C.muted }}>suggested</div>
          </div>
        </div>
        <FactorPills factorScores={entry.factor_scores} />
      </div>
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${C.border}` }}>
          {executing ? (
            <div style={{ paddingTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: C.muted }}>Position Size ($K)</label><input type="number" value={execData.actualSize} onChange={e => setExecData(p => ({ ...p, actualSize: e.target.value }))} style={{ ...inp, marginTop: 4 }} /></div>
                <div><label style={{ fontSize: 10, color: C.muted }}>Entry Price</label><input type="number" value={execData.actualEntry} onChange={e => setExecData(p => ({ ...p, actualEntry: e.target.value }))} style={{ ...inp, marginTop: 4 }} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleExecute} style={{ flex: 1, padding: 11, background: C.success, color: C.white, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>Confirm Execute</button>
                <button onClick={() => setExecuting(false)} style={{ flex: 1, padding: 11, background: C.surface, color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: 12 }}>
              {entry.thesis && <div style={{ fontSize: 12, color: C.textDim, marginBottom: 10, lineHeight: 1.5 }}><span style={{ color: C.muted }}>Thesis: </span>{entry.thesis}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setExecuting(true)} style={{ flex: 1, padding: 11, background: C.success, color: C.white, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>Execute</button>
                <button onClick={() => onSkip(entry.id)} style={{ padding: '11px 14px', background: C.surface, color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13 }}>Skip</button>
                <button onClick={() => onDelete(entry.id)} style={{ padding: '11px 14px', background: C.dangerDim, color: C.danger, border: 'none', borderRadius: 8, fontSize: 13 }}>✕</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OpenEntry({ entry, onClose, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeData, setCloseData] = useState({ actualExit: '', exitDate: new Date().toISOString().split('T')[0], notes: '' });

  const handleClose = async () => {
    if (!closeData.actualExit) { alert('Enter exit price'); return; }
    const pnlPct = ((parseFloat(closeData.actualExit) - parseFloat(entry.actual_entry)) / parseFloat(entry.actual_entry) * 100).toFixed(2);
    const dollarPnl = ((parseFloat(closeData.actualExit) - parseFloat(entry.actual_entry)) / parseFloat(entry.actual_entry) * parseFloat(entry.actual_size) * 1000).toFixed(0);
    await onClose(entry.id, { actual_exit: parseFloat(closeData.actualExit), exit_date: closeData.exitDate, pnl: parseFloat(pnlPct), dollar_pnl: parseFloat(dollarPnl), notes: closeData.notes });
    setClosing(false);
  };

  const inp = { width: '100%', padding: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, color: C.text, outline: 'none' };

  return (
    <div style={{ background: C.card, borderRadius: 12, marginBottom: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
      <div onClick={() => !closing && setExpanded(!expanded)} style={{ padding: 14, cursor: 'pointer', borderLeft: `3px solid ${C.blue}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ ...mono, fontSize: 17, fontWeight: 700, color: C.text }}>{entry.ticker}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: C.blueDim, color: C.blue, fontWeight: 700 }}>OPEN</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{entry.date} · Entry ${entry.actual_entry}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: C.text }}>${entry.actual_size}K</div>
            <div style={{ fontSize: 10, color: C.muted }}>position</div>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${C.border}` }}>
          {closing ? (
            <div style={{ paddingTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div><label style={{ fontSize: 10, color: C.muted }}>Exit Price</label><input type="number" value={closeData.actualExit} onChange={e => setCloseData(p => ({ ...p, actualExit: e.target.value }))} style={{ ...inp, marginTop: 4 }} /></div>
                <div><label style={{ fontSize: 10, color: C.muted }}>Exit Date</label><input type="date" value={closeData.exitDate} onChange={e => setCloseData(p => ({ ...p, exitDate: e.target.value }))} style={{ ...inp, marginTop: 4 }} /></div>
              </div>
              <textarea value={closeData.notes} onChange={e => setCloseData(p => ({ ...p, notes: e.target.value }))} placeholder="Notes..." style={{ ...inp, minHeight: 50, resize: 'none', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleClose} style={{ flex: 1, padding: 11, background: C.gold, color: C.bg, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>Close Position</button>
                <button onClick={() => setClosing(false)} style={{ flex: 1, padding: 11, background: C.surface, color: C.textDim, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: 12 }}>
              {entry.thesis && <div style={{ fontSize: 12, color: C.textDim, marginBottom: 10, lineHeight: 1.5 }}>{entry.thesis}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setClosing(true)} style={{ flex: 1, padding: 11, background: C.gold, color: C.bg, border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>Close</button>
                <button onClick={() => onDelete(entry.id)} style={{ padding: '11px 14px', background: C.dangerDim, color: C.danger, border: 'none', borderRadius: 8, fontSize: 13 }}>Delete</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClosedEntry({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const pnlNum = parseFloat(entry.pnl || 0);
  const dollarPnl = parseFloat(entry.dollar_pnl || 0);
  const isWin = pnlNum >= 0;

  return (
    <div style={{ background: C.card, borderRadius: 12, marginBottom: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: 14, cursor: 'pointer', borderLeft: `3px solid ${isWin ? C.success : C.danger}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ ...mono, fontSize: 17, fontWeight: 700, color: C.text }}>{entry.ticker}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: isWin ? C.successDim : C.dangerDim, color: isWin ? C.success : C.danger, fontWeight: 700 }}>{isWin ? 'WIN' : 'LOSS'}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{entry.date} → {entry.exit_date}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ ...mono, fontSize: 20, fontWeight: 700, color: isWin ? C.success : C.danger }}>{isWin ? '+' : ''}{pnlNum.toFixed(1)}%</div>
            <div style={{ ...mono, fontSize: 11, color: isWin ? C.success : C.danger, fontWeight: 600 }}>{dollarPnl >= 0 ? '+' : ''}${(dollarPnl / 1000).toFixed(1)}K</div>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '10px 14px 14px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 11, background: C.surface, padding: 10, borderRadius: 6, marginBottom: 8 }}>
            {[['Size', `$${entry.actual_size}K`], ['Entry', `$${entry.actual_entry}`], ['Exit', `$${entry.actual_exit}`]].map(([l, v]) => (
              <div key={l}><span style={{ color: C.muted }}>{l}</span><br /><strong style={{ ...mono }}>{v}</strong></div>
            ))}
          </div>
          <FactorPills factorScores={entry.factor_scores} />
          {entry.notes && <div style={{ fontSize: 11, color: C.textDim, padding: 10, background: C.surface, borderRadius: 6, marginTop: 8 }}>{entry.notes}</div>}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// JOURNAL
// ============================================================================
function Journal({ trades, onUpdate, onDelete, onBack, syncStatus }) {
  const [tab, setTab] = useState('pending');

  const pending = trades.filter(e => !e.executed && parseFloat(e.score || 0) > 0).sort((a, b) => new Date(b.date) - new Date(a.date));
  const open    = trades.filter(e => e.executed && e.pnl === null).sort((a, b) => new Date(b.date) - new Date(a.date));
  const closed  = trades.filter(e => e.executed && e.pnl !== null).sort((a, b) => new Date(b.exit_date || 0) - new Date(a.exit_date || 0));

  const wins = closed.filter(e => parseFloat(e.pnl) > 0);
  const stats = {
    total:     closed.length,
    winRate:   closed.length > 0 ? (wins.length / closed.length * 100).toFixed(0) : null,
    avgPnl:    closed.length > 0 ? (closed.reduce((s, e) => s + parseFloat(e.pnl), 0) / closed.length).toFixed(1) : null,
    totalDollar: closed.length > 0 ? closed.reduce((s, e) => s + parseFloat(e.dollar_pnl || 0), 0) : null,
  };

  const handleExecute = async (id, data) => await onUpdate({ ...trades.find(e => e.id === id), ...data });
  const handleClose   = async (id, data) => await onUpdate({ ...trades.find(e => e.id === id), ...data });

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Header title="Trade Journal" onBack={onBack} />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}><SyncBadge status={syncStatus} /></div>

        {/* Stats */}
        <div style={{ background: C.surface, borderRadius: 14, padding: 18, marginBottom: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 600, letterSpacing: '0.12em', marginBottom: 14 }}>PERFORMANCE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            {[
              { label: 'TRADES',   val: stats.total,   color: C.text },
              { label: 'WIN RATE', val: stats.winRate   ? `${stats.winRate}%`   : '—', color: stats.winRate  >= 50 ? C.success : C.danger },
              { label: 'AVG P&L',  val: stats.avgPnl    ? `${parseFloat(stats.avgPnl) >= 0 ? '+' : ''}${stats.avgPnl}%` : '—', color: parseFloat(stats.avgPnl) >= 0 ? C.success : C.danger },
              { label: 'TOTAL $',  val: stats.totalDollar !== null ? `${stats.totalDollar >= 0 ? '+' : ''}$${(stats.totalDollar / 1000).toFixed(1)}K` : '—', color: stats.totalDollar >= 0 ? C.success : C.danger },
            ].map(s => (
              <div key={s.label}>
                <div style={{ ...mono, fontSize: 19, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.1em', marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 14, background: C.surface, borderRadius: 10, padding: 4, gap: 4, border: `1px solid ${C.border}` }}>
          {[
            { key: 'pending', label: 'Pending', count: pending.length },
            { key: 'open',    label: 'Open',    count: open.length    },
            { key: 'closed',  label: 'Closed',  count: closed.length  },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '9px 6px', borderRadius: 8, border: 'none', background: tab === t.key ? C.gold : 'transparent', color: tab === t.key ? C.bg : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
              {t.label}{t.count > 0 ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        {tab === 'pending' && (pending.length === 0 ? <Empty icon="◈" text="No pending trades" /> : pending.map(e => <PendingEntry key={e.id} entry={e} onUpdate={onUpdate} onExecute={handleExecute} onSkip={onDelete} onDelete={onDelete} />))}
        {tab === 'open'    && (open.length    === 0 ? <Empty icon="△" text="No open positions"  /> : open.map(e    => <OpenEntry    key={e.id} entry={e} onClose={handleClose} onDelete={onDelete} />))}
        {tab === 'closed'  && (closed.length  === 0 ? <Empty icon="◇" text="No closed trades"   /> : closed.map(e  => <ClosedEntry  key={e.id} entry={e} />))}
      </div>
    </div>
  );
}

// ============================================================================
// HOME
// ============================================================================
function Home({ trades, watchlist, syncStatus, onNav, onLogout }) {
  const pending    = trades.filter(e => !e.executed && parseFloat(e.score || 0) > 0).length;
  const open       = trades.filter(e => e.executed && e.pnl === null).length;
  const closed     = trades.filter(e => e.executed && e.pnl !== null);
  const totalDollar = closed.length > 0 ? closed.reduce((s, e) => s + parseFloat(e.dollar_pnl || 0), 0) : null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{ maxWidth: 430, margin: '0 auto', padding: 24 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 34 }}>
          <SyncBadge status={syncStatus} />
          <button onClick={onLogout} style={{ fontSize: 12, color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
        </div>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Logo size="large" /></div>
          <div style={{ width: 80, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, margin: '0 auto 12px' }} />
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em' }}>Multiplicative conviction · F1 × F2 × F3 × F4 × F5</div>
        </div>

        {/* Portfolio summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'PENDING',  val: pending,  color: C.warning },
            { label: 'OPEN',     val: open,     color: C.blue    },
            { label: 'P&L',      val: totalDollar !== null ? `${totalDollar >= 0 ? '+' : ''}$${(totalDollar / 1000).toFixed(0)}K` : '—', color: totalDollar !== null ? (totalDollar >= 0 ? C.success : C.danger) : C.muted },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, borderRadius: 12, padding: 14, textAlign: 'center', border: `1px solid ${C.border}` }}>
              <div style={{ ...mono, fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.1em', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button onClick={() => onNav('scorecard')} style={{
          width: '100%', padding: 22, marginBottom: 10,
          background: 'linear-gradient(135deg, #0f1e30 0%, #0d1829 100%)',
          border: `1px solid ${C.goldBorder}`,
          borderRadius: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 16,
          animation: 'glow 3s ease-in-out infinite',
          transition: 'transform 0.15s',
        }}>
          <div style={{ width: 50, height: 50, borderRadius: 12, background: C.goldDim, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ ...mono, fontSize: 22, color: C.gold }}>◈</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ ...serif, color: C.gold, fontSize: 20, fontWeight: 700, lineHeight: 1 }}>Score a Trade</div>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>5-factor multiplicative conviction model</div>
          </div>
        </button>

        {/* Secondary nav */}
        {[
          { key: 'journal',   icon: '◇', label: 'Trade Journal',  sub: `${closed.length} closed · ${open} open positions` },
          { key: 'watchlist', icon: '◎', label: 'Watchlist',      sub: `${watchlist.length} ticker${watchlist.length !== 1 ? 's' : ''} · Prices & alerts` },
        ].map(btn => (
          <button key={btn.key} onClick={() => onNav(btn.key)} style={{ width: '100%', padding: 18, marginBottom: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ ...mono, fontSize: 18, color: C.muted }}>{btn.icon}</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>{btn.label}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{btn.sub}</div>
            </div>
          </button>
        ))}

        {/* Sizing reference table */}
        <div style={{ marginTop: 20, padding: 16, background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.gold, fontWeight: 600, letterSpacing: '0.12em', marginBottom: 12 }}>POSITION SIZING · $100K MAXIMUM</div>
          {[
            ['All 5s',  '5⁵ = 3125',  '100.0%', '$100K',   C.gold    ],
            ['All 4s',  '4⁵ = 1024',  ' 32.8%', ' $32.8K', C.success ],
            ['Mixed 4/3', '4⁴×3 = 768', ' 24.6%', ' $24.6K', C.success ],
            ['All 3s',  '3⁵ = 243',   '  7.8%', '  $7.8K', C.blue    ],
            ['Any 0',   '—',           '  0.0%', '     $0', C.danger  ],
          ].map(([label, formula, pct, size, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}`, fontSize: 11, ...mono }}>
              <span style={{ color: C.textDim, minWidth: 70 }}>{label}</span>
              <span style={{ color: C.muted, fontSize: 10, flex: 1 }}>{formula}</span>
              <span style={{ color, fontWeight: 700 }}>{pct} → {size}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 10, color: C.muted, letterSpacing: '0.06em' }}>
          Score your trades. Stay disciplined.
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ROOT APP
// ============================================================================
export default function App() {
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState('home');
  const [trades, setTrades]         = useState([]);
  const [watchlist, setWatchlist]   = useState([]);
  const [syncStatus, setSyncStatus] = useState('syncing');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    setSyncStatus('syncing');
    try {
      const { data: t } = await supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setTrades(t || []);
      const { data: w } = await supabase.from('watchlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setWatchlist(w || []);
      setSyncStatus('synced');
    } catch { setSyncStatus('error'); }
  };

  const addTrade = async (trade) => {
    setSyncStatus('syncing');
    const { data } = await supabase.from('trades').insert([{ ...trade, user_id: user.id }]).select().single();
    if (data) setTrades(p => [data, ...p]);
    setSyncStatus('synced');
  };

  const updateTrade = async (trade) => {
    setSyncStatus('syncing');
    const { data } = await supabase.from('trades').update(trade).eq('id', trade.id).select().single();
    if (data) setTrades(p => p.map(t => t.id === trade.id ? data : t));
    setSyncStatus('synced');
  };

  const deleteTrade = async (id) => {
    if (!confirm('Delete this trade?')) return;
    setSyncStatus('syncing');
    await supabase.from('trades').delete().eq('id', id);
    setTrades(p => p.filter(t => t.id !== id));
    setSyncStatus('synced');
  };

  const addToWatchlist = async (item) => {
    setSyncStatus('syncing');
    const { data } = await supabase.from('watchlist').insert([{ ...item, user_id: user.id }]).select().single();
    if (data) setWatchlist(p => [data, ...p]);
    setSyncStatus('synced');
  };

  const updateWatchlistItem = async (item) => {
    setSyncStatus('syncing');
    const { data } = await supabase.from('watchlist').update(item).eq('id', item.id).select().single();
    if (data) setWatchlist(p => p.map(w => w.id === item.id ? data : w));
    setSyncStatus('synced');
  };

  const removeFromWatchlist = async (id) => {
    setSyncStatus('syncing');
    await supabase.from('watchlist').delete().eq('id', id);
    setWatchlist(p => p.filter(w => w.id !== id));
    setSyncStatus('synced');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Logo size="large" />
    </div>
  );

  if (!user) return <AuthScreen />;

  if (view === 'scorecard') return <Scorecard onLog={async (t) => { await addTrade(t); setView('journal'); }} onCancel={() => setView('home')} />;
  if (view === 'journal')   return <Journal   trades={trades} onUpdate={updateTrade} onDelete={deleteTrade} onBack={() => setView('home')} syncStatus={syncStatus} />;
  if (view === 'watchlist') return <Watchlist watchlist={watchlist} onAdd={addToWatchlist} onUpdate={updateWatchlistItem} onRemove={removeFromWatchlist} onBack={() => setView('home')} />;

  return <Home trades={trades} watchlist={watchlist} syncStatus={syncStatus} onNav={setView} onLogout={() => supabase.auth.signOut()} />;
}
