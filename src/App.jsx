import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION - Replace these with your actual values
// ============================================================================
const SUPABASE_URL = 'https://artovozlajxjhqjentph.supabase.co';           // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFydG92b3psYWp4amhxamVudHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTAzNjIsImV4cCI6MjA4NDg2NjM2Mn0.bnfx9qIQwchUwWfYMa_jcYcyqvXVTBQaY17JST8lvfA'; // e.g., 'eyJhbGciOiJIUzI1NiIs...'
const FINNHUB_API_KEY = 'd5qopgpr01qhn30h1420d5qopgpr01qhn30h142g';     // e.g., 'c1234567890abcdef'

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// STYLES
// ============================================================================
const colors = {
  primary: '#0f172a',
  secondary: '#1e293b',
  accent: '#d4af37',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  neutral: '#64748b',
  light: '#f8fafc',
  white: '#ffffff',
  border: '#e2e8f0',
  typeA: '#1d4ed8',
  typeB: '#047857',
};

// ============================================================================
// FINNHUB API FUNCTIONS
// ============================================================================
async function fetchStockQuote(symbol) {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    const data = await response.json();
    if (data.c) {
      return { current: data.c, change: data.d, changePercent: data.dp, high: data.h, low: data.l, open: data.o, prevClose: data.pc };
    }
    return null;
  } catch (error) {
    console.error('Error fetching quote:', error);
    return null;
  }
}

async function fetchStockNews(symbol) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${weekAgo}&to=${today}&token=${FINNHUB_API_KEY}`);
    const data = await response.json();
    return data.slice(0, 5);
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

async function searchSymbol(query) {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_API_KEY}`);
    const data = await response.json();
    return data.result?.slice(0, 10) || [];
  } catch (error) {
    console.error('Error searching symbol:', error);
    return [];
  }
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
function Logo({ size = 'default' }) {
  const sizes = { small: { icon: 28, text: 14, sub: 9 }, default: { icon: 36, text: 20, sub: 11 }, large: { icon: 44, text: 26, sub: 12 } };
  const s = sizes[size];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: s.icon, height: s.icon, background: `linear-gradient(135deg, ${colors.accent} 0%, #b8962e 100%)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)' }}>
        <svg width={s.icon * 0.55} height={s.icon * 0.55} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke={colors.primary} strokeWidth="2" fill="none"/>
          <path d="M12 6L8 8.5V13.5L12 16L16 13.5V8.5L12 6Z" fill={colors.primary}/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: s.text, fontWeight: 700, color: colors.white, letterSpacing: '-0.02em', lineHeight: 1.1 }}>LANTERN</div>
        <div style={{ fontSize: s.sub, color: colors.accent, letterSpacing: '0.12em', fontWeight: 500 }}>CAPITAL ADVISORS</div>
      </div>
    </div>
  );
}

function Header({ title, onBack, showLogo = true }) {
  return (
    <div style={{ background: colors.primary, padding: '14px 20px', paddingTop: 'max(14px, env(safe-area-inset-top))', position: 'sticky', top: 0, zIndex: 100, borderBottom: `1px solid ${colors.secondary}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {onBack ? (
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: colors.white, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>← Back</button>
        ) : <div style={{ width: 70 }} />}
        {showLogo && <Logo size="small" />}
        <div style={{ width: 70 }} />
      </div>
      {title && (
        <div style={{ textAlign: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ color: colors.white, fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h2>
        </div>
      )}
    </div>
  );
}

function SyncStatus({ status }) {
  const config = {
    synced: { color: colors.success, text: '✓ Synced', bg: '#ecfdf5' },
    syncing: { color: colors.warning, text: '↻ Syncing...', bg: '#fffbeb' },
    offline: { color: colors.neutral, text: '○ Offline', bg: colors.light },
    error: { color: colors.danger, text: '✕ Error', bg: '#fef2f2' }
  }[status] || { color: colors.neutral, text: '○ Offline', bg: colors.light };
  return <div style={{ fontSize: 10, padding: '4px 8px', borderRadius: 4, background: config.bg, color: config.color, fontWeight: 600 }}>{config.text}</div>;
}

// ============================================================================
// SCORECARD CONFIGS
// ============================================================================
const TYPE_A_CONFIG = {
  name: 'Tipping Point/IPO',
  sections: [
    { title: 'Sector Quality', maxPoints: 25, signals: [
      { id: 'bullish_market', label: 'market strength', max: 10, hints: ['10: Very strong', '7: Strong', '4: Weak', '0: Very weak'] },
      { id: 'price_dislocation', label: 'undervaluation', max: 8, hints: ['8: Very ignored', '5: Ignored', '2: Recognized', '0: Well covered'] },
      { id: 'continuous newsflow', label: 'newsflow', max: 7, hints: ['7: 3-6 months', '5: 1-3 months', '2: less than 1 month', '0: 1 week'] },
    ]},
    { title: 'Company Quality', maxPoints: 25, signals: [
      { id: 'business_quality', label: 'hype_potential', max: 10, hints: ['10: <50% of breakout', '7: Lighter', '4: Similar', '0: Increasing'] },
      { id: 'founder_quality', label: 'well-known founder', max: 9, hints: ['9: Confluence', '6: Single clear', '3: Near support', '0: None'] },
      { id: 'backer_quality', label: 'good institutions', max: 6, hints: ['6: No bad news', '4: Minor', '2: Concerning', '0: Thesis impaired'] },
    ]},
    { title: 'Catalyst quality', maxPoints: 20, signals: [
      { id: 'Catalyst_quality', label: 'fundamentally changing', max: 10, hints: ['10: Longterm potential', '7: 1-2 months potential', '4: 1-2 weeks potential', '1 pump potential'] },
      { id: 'upside', label: 'Risk/reward check', max: 10, hints: ['10: R/R >3:1', '7: 2-3:1', '4: ~1.5:1', '0: <1.5:1'] },
    ]},
    { title: 'Risk Definition', maxPoints: 30, signals: [
      { id: 'stop_defined', label: 'Support defined', max: 12, hints: ['12: Low downside', '9: 10% downside', '5: Lots of downside', '0: Cant define'] },
      { id: 'size_defined', label: 'Size vs. downside', max: 10, hints: ['10: Stop-out = 1-2% loss', '6: Roughly ok', '3: Arbitrary', '0: Ignoring'] },
      { id: 'target_defined', label: 'Target defined', max: 8, hints: ['8: Target + horizon', '5: Rough target', '2: Vague', '0: None'] },
    ]}
  ]
};

const TYPE_B_CONFIG = {
  name: 'Pullback',
  sections: [
    { title: 'Trend Quality', maxPoints: 25, signals: [
      { id: 'thesis_intact', label: 'Original thesis intact', max: 10, hints: ['10: Unchanged', '7: Minor concerns', '4: Degraded', '0: Broken'] },
      { id: 'prior_breakout', label: 'Prior breakout quality', max: 8, hints: ['8: Textbook', '5: Solid', '2: Weak', '0: Never broke out'] },
      { id: 'price_structure', label: 'Price structure', max: 7, hints: ['7: Above 21 EMA', '5: Testing 50 MA', '2: Below 50', '0: Broken'] },
    ]},
    { title: 'Pullback Quality', maxPoints: 25, signals: [
      { id: 'volume_contraction', label: 'Volume contraction', max: 10, hints: ['10: <50% of breakout', '7: Lighter', '4: Similar', '0: Increasing'] },
      { id: 'support_quality', label: 'Support quality', max: 9, hints: ['9: Confluence', '6: Single clear', '3: Near support', '0: None'] },
      { id: 'news_check', label: 'News check', max: 6, hints: ['6: No bad news', '4: Minor', '2: Concerning', '0: Thesis impaired'] },
    ]},
    { title: 'Re-entry Timing', maxPoints: 20, signals: [
      { id: 'stabilization', label: 'Stabilization evidence', max: 10, hints: ['10: Reversal signal', '7: Stabilizing', '4: Early', '0: Falling knife'] },
      { id: 'risk_reward', label: 'Risk/reward check', max: 10, hints: ['10: R/R >3:1', '7: 2-3:1', '4: ~1.5:1', '0: <1.5:1'] },
    ]},
    { title: 'Risk Definition', maxPoints: 30, signals: [
      { id: 'stop_below', label: 'Stop below support', max: 12, hints: ['12: Just below invalidation', '9: Defined', '5: Rough', '0: None'] },
      { id: 'size_volatility', label: 'Size vs. volatility', max: 10, hints: ['10: Stop-out = 1-2% loss', '6: Roughly ok', '3: Arbitrary', '0: Ignoring'] },
      { id: 'target_defined', label: 'Target defined', max: 8, hints: ['8: Target + horizon', '5: Rough target', '2: Vague', '0: None'] },
    ]}
  ]
};

function getDecision(score) {
  if (score < 60) return { text: 'NO TRADE', color: colors.danger, size: '$0K', bg: '#fef2f2' };
  if (score < 70) return { text: 'LOW CONVICTION', color: colors.warning, size: '$10-25K', bg: '#fffbeb' };
  if (score < 80) return { text: 'MEDIUM', color: colors.typeA, size: '$25-50K', bg: '#eff6ff' };
  if (score < 90) return { text: 'HIGH CONVICTION', color: colors.success, size: '$50-75K', bg: '#ecfdf5' };
  return { text: 'MAXIMUM', color: colors.success, size: '$75-100K', bg: '#ecfdf5' };
}

// ============================================================================
// AUTH SCREEN
// ============================================================================
function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError('Check your email to confirm your account');
        setMode('login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Logo size="large" />
          <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`, margin: '20px auto' }} />
        </div>
        <div style={{ background: colors.white, borderRadius: 16, padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 20, color: colors.primary, textAlign: 'center' }}>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <form onSubmit={handleSubmit}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 14, border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 15, boxSizing: 'border-box', marginBottom: 12 }} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 14, border: `1px solid ${colors.border}`, borderRadius: 10, fontSize: 15, boxSizing: 'border-box', marginBottom: 12 }} required minLength={6} />
            {error && <div style={{ padding: 12, background: error.includes('Check') ? '#ecfdf5' : '#fef2f2', borderRadius: 8, marginBottom: 12, fontSize: 13, color: error.includes('Check') ? colors.success : colors.danger }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: colors.primary, color: colors.white, border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}</button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: colors.accent, fontSize: 14, cursor: 'pointer' }}>{mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SIGNAL INPUT
// ============================================================================
function SignalInput({ signal, value, onChange }) {
  const [showHints, setShowHints] = useState(false);
  const pct = ((value || 0) / signal.max) * 100;
  return (
    <div style={{ marginBottom: 12, background: colors.light, borderRadius: 10, padding: 14, border: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: colors.primary, flex: 1 }}>{signal.label}</span>
        <button onClick={() => setShowHints(!showHints)} style={{ background: showHints ? colors.secondary : 'transparent', border: `1px solid ${colors.border}`, color: showHints ? colors.white : colors.neutral, fontSize: 11, cursor: 'pointer', padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>{showHints ? 'Hide' : 'Guide'}</button>
      </div>
      {showHints && <div style={{ marginBottom: 12, padding: 10, background: colors.white, borderRadius: 6, border: `1px solid ${colors.border}` }}>{signal.hints.map((h, i) => <div key={i} style={{ fontSize: 12, color: colors.neutral, lineHeight: 1.7 }}>{h}</div>)}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 6, background: colors.border, borderRadius: 3, transform: 'translateY(-50%)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct > 70 ? colors.success : pct > 40 ? colors.warning : colors.danger, borderRadius: 3 }} />
          </div>
          <input type="range" min="0" max={signal.max} value={value || 0} onChange={(e) => onChange(parseInt(e.target.value))} style={{ width: '100%', opacity: 0, cursor: 'pointer', height: 28 }} />
        </div>
        <div style={{ minWidth: 50, textAlign: 'center', fontWeight: 700, fontSize: 14, color: pct > 70 ? colors.success : pct > 40 ? colors.warning : colors.danger, background: colors.white, padding: '6px 8px', borderRadius: 6, border: `1px solid ${colors.border}` }}>{value || 0}/{signal.max}</div>
      </div>
    </div>
  );
}

// ============================================================================
// SCORECARD
// ============================================================================
function Scorecard({ type, onLog, onCancel }) {
  const config = type === 'A' ? TYPE_A_CONFIG : TYPE_B_CONFIG;
  const [scores, setScores] = useState({});
  const [tradeInfo, setTradeInfo] = useState({ ticker: '', entry: '', stop: '', target: '', thesis: '' });
  const [saving, setSaving] = useState(false);
  const totalScore = Object.values(scores).reduce((sum, val) => sum + (val || 0), 0);
  const decision = getDecision(totalScore);

  const handleLog = async () => {
    if (!tradeInfo.ticker) { alert('Please enter a ticker'); return; }
    setSaving(true);
    await onLog({
      date: new Date().toISOString().split('T')[0],
      ticker: tradeInfo.ticker.toUpperCase(),
      type,
      score: totalScore,
      decision: decision.text,
      suggested_size: decision.size,
      planned_entry: tradeInfo.entry ? parseFloat(tradeInfo.entry) : null,
      planned_stop: tradeInfo.stop ? parseFloat(tradeInfo.stop) : null,
      planned_target: tradeInfo.target ? parseFloat(tradeInfo.target) : null,
      thesis: tradeInfo.thesis,
      executed: false,
    });
    setSaving(false);
  };

  const inputStyle = { padding: 12, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 15, background: colors.white, width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: colors.light, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Header title={`Type ${type}: ${config.name}`} onBack={onCancel} />
      <div style={{ padding: 16, paddingBottom: 200 }}>
        <div style={{ background: colors.white, borderRadius: 12, padding: 16, marginBottom: 14, border: `1px solid ${colors.border}` }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 11, color: colors.neutral, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Trade Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input type="text" placeholder="Ticker *" value={tradeInfo.ticker} onChange={(e) => setTradeInfo(p => ({ ...p, ticker: e.target.value.toUpperCase() }))} style={{ ...inputStyle, fontWeight: 600 }} />
            <input type="number" placeholder="Planned Entry" value={tradeInfo.entry} onChange={(e) => setTradeInfo(p => ({ ...p, entry: e.target.value }))} style={inputStyle} />
            <input type="number" placeholder="Planned Stop" value={tradeInfo.stop} onChange={(e) => setTradeInfo(p => ({ ...p, stop: e.target.value }))} style={inputStyle} />
            <input type="number" placeholder="Planned Target" value={tradeInfo.target} onChange={(e) => setTradeInfo(p => ({ ...p, target: e.target.value }))} style={inputStyle} />
          </div>
          <textarea placeholder="Investment thesis..." value={tradeInfo.thesis} onChange={(e) => setTradeInfo(p => ({ ...p, thesis: e.target.value }))} style={{ ...inputStyle, marginTop: 10, resize: 'none', minHeight: 64, fontFamily: 'inherit' }} />
        </div>
        {config.sections.map((section, idx) => {
          const sectionScore = section.signals.reduce((sum, sig) => sum + (scores[sig.id] || 0), 0);
          const sectionPct = (sectionScore / section.maxPoints) * 100;
          return (
            <div key={idx} style={{ background: colors.white, borderRadius: 12, padding: 16, marginBottom: 14, border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 11, color: colors.neutral, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{section.title}</h3>
                <span style={{ background: sectionPct >= 70 ? '#ecfdf5' : sectionPct >= 50 ? '#fffbeb' : '#fef2f2', color: sectionPct >= 70 ? colors.success : sectionPct >= 50 ? colors.warning : colors.danger, padding: '5px 10px', borderRadius: 16, fontSize: 12, fontWeight: 700 }}>{sectionScore}/{section.maxPoints}</span>
              </div>
              {section.signals.map(sig => <SignalInput key={sig.id} signal={sig} value={scores[sig.id]} onChange={(val) => setScores(p => ({ ...p, [sig.id]: val }))} />)}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: colors.white, borderTop: `1px solid ${colors.border}`, padding: 16, paddingBottom: 'max(16px, env(safe-area-inset-bottom))', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div><span style={{ fontSize: 40, fontWeight: 800, color: decision.color }}>{totalScore}</span><span style={{ fontSize: 14, color: colors.neutral }}>/100</span></div>
          <div style={{ textAlign: 'right', background: decision.bg, padding: '8px 14px', borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: decision.color }}>{decision.text}</div>
            <div style={{ fontSize: 12, color: colors.neutral }}>Size: {decision.size}</div>
          </div>
        </div>
        <button onClick={handleLog} disabled={totalScore < 60 || saving} style={{ width: '100%', padding: 14, background: totalScore >= 60 ? colors.primary : colors.border, color: totalScore >= 60 ? colors.white : colors.neutral, border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: totalScore >= 60 && !saving ? 'pointer' : 'not-allowed' }}>{saving ? 'Saving...' : totalScore < 60 ? 'Score Below 60' : 'Save to Journal →'}</button>
      </div>
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => { if (watchlist.length > 0) loadQuotes(); }, [watchlist]);

  const loadQuotes = async () => {
    setLoadingQuotes(true);
    const newQuotes = {};
    for (const item of watchlist) {
      const quote = await fetchStockQuote(item.ticker);
      if (quote) newQuotes[item.ticker] = quote;
    }
    setQuotes(newQuotes);
    setLoadingQuotes(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchSymbol(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleAddTicker = async (symbol, description) => {
    await onAdd({ ticker: symbol, name: description, alert_above: null, alert_below: null, notes: '' });
    setShowAdd(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleViewDetails = async (item) => {
    setSelectedItem(item);
    setLoadingNews(true);
    const newsData = await fetchStockNews(item.ticker);
    setNews(newsData);
    setLoadingNews(false);
  };

  if (selectedItem) {
    return <WatchlistDetail item={selectedItem} quote={quotes[selectedItem.ticker]} news={news} loadingNews={loadingNews} onBack={() => setSelectedItem(null)} onUpdate={onUpdate} onRemove={onRemove} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.light, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Header title="Watchlist" onBack={onBack} />
      <div style={{ padding: 16 }}>
        <button onClick={() => setShowAdd(true)} style={{ width: '100%', padding: 14, background: colors.primary, color: colors.white, border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, marginBottom: 16, cursor: 'pointer' }}>+ Add to Watchlist</button>
        <button onClick={loadQuotes} disabled={loadingQuotes} style={{ width: '100%', padding: 10, background: colors.white, color: colors.neutral, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13, marginBottom: 16, cursor: loadingQuotes ? 'not-allowed' : 'pointer' }}>{loadingQuotes ? 'Refreshing...' : '↻ Refresh Prices'}</button>

        {showAdd && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: colors.white, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400, maxHeight: '80vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>Add Ticker</h3>
                <button onClick={() => { setShowAdd(false); setSearchResults([]); setSearchQuery(''); }} style={{ background: 'none', border: 'none', fontSize: 24, color: colors.neutral, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input type="text" placeholder="Search ticker..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.toUpperCase())} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} style={{ flex: 1, padding: 12, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 15 }} />
                <button onClick={handleSearch} disabled={searching} style={{ padding: '12px 16px', background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontWeight: 600 }}>{searching ? '...' : 'Search'}</button>
              </div>
              {searchResults.map((r, i) => (
                <div key={i} onClick={() => handleAddTicker(r.symbol, r.description)} style={{ padding: 12, borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}>
                  <div style={{ fontWeight: 600 }}>{r.symbol}</div>
                  <div style={{ fontSize: 12, color: colors.neutral }}>{r.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {watchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: colors.neutral, background: colors.white, borderRadius: 12, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>👀</div>
            <div style={{ fontWeight: 600 }}>Watchlist empty</div>
          </div>
        ) : watchlist.map(item => {
          const quote = quotes[item.ticker];
          const hasAlert = (item.alert_above && quote?.current >= item.alert_above) || (item.alert_below && quote?.current <= item.alert_below);
          return (
            <div key={item.id} onClick={() => handleViewDetails(item)} style={{ background: colors.white, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${hasAlert ? colors.warning : colors.border}`, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 17, fontWeight: 700 }}>{item.ticker}</span>
                    {hasAlert && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#fffbeb', color: colors.warning, fontWeight: 600 }}>ALERT</span>}
                  </div>
                  <div style={{ fontSize: 11, color: colors.neutral, marginTop: 2 }}>{item.name}</div>
                </div>
                {quote ? (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>${quote.current.toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: quote.changePercent >= 0 ? colors.success : colors.danger, fontWeight: 600 }}>{quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%</div>
                  </div>
                ) : <div style={{ fontSize: 12, color: colors.neutral }}>Loading...</div>}
              </div>
              {(item.alert_above || item.alert_below) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 11 }}>
                  {item.alert_above && <span style={{ padding: '2px 6px', background: colors.light, borderRadius: 4 }}>Above: ${item.alert_above}</span>}
                  {item.alert_below && <span style={{ padding: '2px 6px', background: colors.light, borderRadius: 4 }}>Below: ${item.alert_below}</span>}
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

  const handleRemove = async () => {
    if (confirm(`Remove ${item.ticker}?`)) { await onRemove(item.id); onBack(); }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.light, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Header title={item.ticker} onBack={onBack} />
      <div style={{ padding: 16 }}>
        <div style={{ background: colors.white, borderRadius: 12, padding: 16, marginBottom: 14, border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 11, color: colors.neutral, marginBottom: 4 }}>{item.name}</div>
          {quote ? (
            <>
              <div style={{ fontSize: 32, fontWeight: 800 }}>${quote.current.toFixed(2)}</div>
              <div style={{ fontSize: 14, color: quote.changePercent >= 0 ? colors.success : colors.danger, fontWeight: 600 }}>{quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: 11, paddingTop: 12, marginTop: 12, borderTop: `1px solid ${colors.border}` }}>
                <div><span style={{ color: colors.neutral }}>Open</span><br/><strong>${quote.open.toFixed(2)}</strong></div>
                <div><span style={{ color: colors.neutral }}>High</span><br/><strong>${quote.high.toFixed(2)}</strong></div>
                <div><span style={{ color: colors.neutral }}>Low</span><br/><strong>${quote.low.toFixed(2)}</strong></div>
                <div><span style={{ color: colors.neutral }}>Prev</span><br/><strong>${quote.prevClose.toFixed(2)}</strong></div>
              </div>
            </>
          ) : <div style={{ color: colors.neutral }}>Loading...</div>}
        </div>

        <div style={{ background: colors.white, borderRadius: 12, padding: 16, marginBottom: 14, border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 11, color: colors.neutral, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price Alerts</h3>
            {!editing && <button onClick={() => setEditing(true)} style={{ fontSize: 12, color: colors.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Edit</button>}
          </div>
          {editing ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: colors.neutral }}>Alert Above ($)</label>
                  <input type="number" value={editData.alert_above || ''} onChange={(e) => setEditData(p => ({ ...p, alert_above: e.target.value }))} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, marginTop: 4, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: colors.neutral }}>Alert Below ($)</label>
                  <input type="number" value={editData.alert_below || ''} onChange={(e) => setEditData(p => ({ ...p, alert_below: e.target.value }))} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, marginTop: 4, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, color: colors.neutral }}>Notes</label>
                <textarea value={editData.notes || ''} onChange={(e) => setEditData(p => ({ ...p, notes: e.target.value }))} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, marginTop: 4, fontSize: 13, minHeight: 60, resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSave} style={{ flex: 1, padding: 11, background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Save</button>
                <button onClick={() => { setEditing(false); setEditData({ ...item }); }} style={{ flex: 1, padding: 11, background: colors.light, color: colors.neutral, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, padding: 10, background: colors.light, borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: colors.neutral }}>Alert Above</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.alert_above ? `$${item.alert_above}` : 'Not set'}</div>
                </div>
                <div style={{ flex: 1, padding: 10, background: colors.light, borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: colors.neutral }}>Alert Below</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.alert_below ? `$${item.alert_below}` : 'Not set'}</div>
                </div>
              </div>
              {item.notes && <div style={{ fontSize: 12, color: colors.neutral, padding: 10, background: colors.light, borderRadius: 6, marginTop: 10 }}>{item.notes}</div>}
            </div>
          )}
        </div>

        <div style={{ background: colors.white, borderRadius: 12, padding: 16, marginBottom: 14, border: `1px solid ${colors.border}` }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 11, color: colors.neutral, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent News</h3>
          {loadingNews ? <div style={{ textAlign: 'center', padding: 20, color: colors.neutral }}>Loading...</div> : news.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: colors.neutral, fontSize: 13 }}>No recent news</div> : news.map((article, i) => (
            <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: 12, borderBottom: i < news.length - 1 ? `1px solid ${colors.border}` : 'none', textDecoration: 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.primary, marginBottom: 4 }}>{article.headline}</div>
              <div style={{ fontSize: 11, color: colors.neutral }}>{article.source} • {new Date(article.datetime * 1000).toLocaleDateString()}</div>
            </a>
          ))}
        </div>

        <button onClick={handleRemove} style={{ width: '100%', padding: 14, background: '#fef2f2', color: colors.danger, border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Remove from Watchlist</button>
      </div>
    </div>
  );
}

// ============================================================================
// TRADE ENTRIES
// ============================================================================
function PendingEntry({ entry, onUpdate, onExecute, onSkip, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execData, setExecData] = useState({ actualSize: '', actualEntry: '' });
  const accent = entry.type === 'A' ? colors.typeA : colors.typeB;

  const handleExecute = async () => {
    if (!execData.actualSize || !execData.actualEntry) { alert('Fill in size and entry'); return; }
    await onExecute(entry.id, { actual_size: parseFloat(execData.actualSize), actual_entry: parseFloat(execData.actualEntry), executed: true });
    setExecuting(false);
  };

  return (
    <div style={{ background: colors.white, borderRadius: 12, marginBottom: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
      <div onClick={() => !executing && setExpanded(!expanded)} style={{ padding: 14, cursor: 'pointer', borderLeft: `4px solid ${accent}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{entry.ticker}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: entry.type === 'A' ? '#eff6ff' : '#ecfdf5', color: accent, fontWeight: 600 }}>{entry.type === 'A' ? 'TIPPING' : 'PULLBACK'}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#fffbeb', color: colors.warning, fontWeight: 600 }}>PENDING</span>
            </div>
            <div style={{ fontSize: 11, color: colors.neutral }}>{entry.date} • Score: {entry.score}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{entry.suggested_size}</div>
            <div style={{ fontSize: 10, color: colors.neutral }}>suggested</div>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${colors.border}` }}>
          {executing ? (
            <div style={{ paddingTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div><label style={{ fontSize: 10, color: colors.neutral }}>Size ($K)</label><input type="number" value={execData.actualSize} onChange={(e) => setExecData(p => ({ ...p, actualSize: e.target.value }))} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, marginTop: 4, fontSize: 13, boxSizing: 'border-box' }} /></div>
                <div><label style={{ fontSize: 10, color: colors.neutral }}>Entry Price</label><input type="number" value={execData.actualEntry} onChange={(e) => setExecData(p => ({ ...p, actualEntry: e.target.value }))} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, marginTop: 4, fontSize: 13, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleExecute} style={{ flex: 1, padding: 11, background: colors.success, color: colors.white, border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Confirm</button>
                <button onClick={() => setExecuting(false)} style={{ flex: 1, padding: 11, background: colors.light, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: 12 }}>
              <div style={{ fontSize: 12, marginBottom: 8 }}><span style={{ color: colors.neutral }}>Thesis:</span> {entry.thesis || '—'}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setExecuting(true)} style={{ flex: 1, padding: 11, background: colors.success, color: colors.white, border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Execute</button>
                <button onClick={() => onSkip(entry.id)} style={{ padding: '11px 12px', background: colors.light, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13 }}>Skip</button>
                <button onClick={() => onDelete(entry.id)} style={{ padding: '11px 12px', background: '#fef2f2', color: colors.danger, border: 'none', borderRadius: 8, fontSize: 13 }}>✕</button>
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
  const accent = entry.type === 'A' ? colors.typeA : colors.typeB;

  const handleClose = async () => {
    if (!closeData.actualExit) { alert('Enter exit price'); return; }
    const pnl = ((parseFloat(closeData.actualExit) - parseFloat(entry.actual_entry)) / parseFloat(entry.actual_entry) * 100).toFixed(2);
    const dollarPnl = ((parseFloat(closeData.actualExit) - parseFloat(entry.actual_entry)) / parseFloat(entry.actual_entry) * parseFloat(entry.actual_size) * 1000).toFixed(0);
    await onClose(entry.id, { actual_exit: parseFloat(closeData.actualExit), exit_date: closeData.exitDate, pnl: parseFloat(pnl), dollar_pnl: parseFloat(dollarPnl), notes: closeData.notes });
    setClosing(false);
  };

  return (
    <div style={{ background: colors.white, borderRadius: 12, marginBottom: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
      <div onClick={() => !closing && setExpanded(!expanded)} style={{ padding: 14, cursor: 'pointer', borderLeft: `4px solid ${accent}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{entry.ticker}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#dbeafe', color: colors.typeA, fontWeight: 600 }}>OPEN</span>
            </div>
            <div style={{ fontSize: 11, color: colors.neutral }}>{entry.date} • Entry: ${entry.actual_entry}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>${entry.actual_size}K</div>
            <div style={{ fontSize: 10, color: colors.neutral }}>position</div>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${colors.border}` }}>
          {closing ? (
            <div style={{ paddingTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 10, color: colors.neutral }}>Exit Price</label><input type="number" value={closeData.actualExit} onChange={(e) => setCloseData(p => ({ ...p, actualExit: e.target.value }))} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, marginTop: 4, fontSize: 13, boxSizing: 'border-box' }} /></div>
                <div><label style={{ fontSize: 10, color: colors.neutral }}>Exit Date</label><input type="date" value={closeData.exitDate} onChange={(e) => setCloseData(p => ({ ...p, exitDate: e.target.value }))} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, marginTop: 4, fontSize: 13, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ marginBottom: 10 }}><label style={{ fontSize: 10, color: colors.neutral }}>Notes</label><textarea value={closeData.notes} onChange={(e) => setCloseData(p => ({ ...p, notes: e.target.value }))} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, marginTop: 4, fontSize: 13, minHeight: 50, resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleClose} style={{ flex: 1, padding: 11, background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Close Position</button>
                <button onClick={() => setClosing(false)} style={{ flex: 1, padding: 11, background: colors.light, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: 12 }}>
              <div style={{ fontSize: 12, marginBottom: 8 }}><span style={{ color: colors.neutral }}>Thesis:</span> {entry.thesis || '—'}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setClosing(true)} style={{ flex: 1, padding: 11, background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Close</button>
                <button onClick={() => onDelete(entry.id)} style={{ padding: '11px 14px', background: '#fef2f2', color: colors.danger, border: 'none', borderRadius: 8, fontSize: 13 }}>Delete</button>
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
  const dollarPnlNum = parseFloat(entry.dollar_pnl || 0);

  return (
    <div style={{ background: colors.white, borderRadius: 12, marginBottom: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: 14, cursor: 'pointer', borderLeft: `4px solid ${pnlNum >= 0 ? colors.success : colors.danger}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{entry.ticker}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: pnlNum >= 0 ? '#ecfdf5' : '#fef2f2', color: pnlNum >= 0 ? colors.success : colors.danger, fontWeight: 600 }}>{pnlNum >= 0 ? 'WIN' : 'LOSS'}</span>
            </div>
            <div style={{ fontSize: 11, color: colors.neutral }}>{entry.date} → {entry.exit_date}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: pnlNum >= 0 ? colors.success : colors.danger }}>{pnlNum >= 0 ? '+' : ''}{entry.pnl}%</div>
            <div style={{ fontSize: 11, color: pnlNum >= 0 ? colors.success : colors.danger, fontWeight: 600 }}>{dollarPnlNum >= 0 ? '+' : ''}${(dollarPnlNum/1000).toFixed(1)}K</div>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '12px 14px 14px', borderTop: `1px solid ${colors.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 11, background: colors.light, padding: 10, borderRadius: 6 }}>
            <div><span style={{ color: colors.neutral }}>Size:</span> <strong>${entry.actual_size}K</strong></div>
            <div><span style={{ color: colors.neutral }}>Entry:</span> <strong>${entry.actual_entry}</strong></div>
            <div><span style={{ color: colors.neutral }}>Exit:</span> <strong>${entry.actual_exit}</strong></div>
          </div>
          {entry.notes && <div style={{ fontSize: 11, color: colors.neutral, padding: 10, background: colors.light, borderRadius: 6, marginTop: 8 }}><strong>Notes:</strong> {entry.notes}</div>}
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
  const pending = trades.filter(e => !e.executed && e.score >= 60).sort((a, b) => new Date(b.date) - new Date(a.date));
  const open = trades.filter(e => e.executed && !e.pnl).sort((a, b) => new Date(b.date) - new Date(a.date));
  const closed = trades.filter(e => e.executed && e.pnl !== null).sort((a, b) => new Date(b.exit_date) - new Date(a.exit_date));

  const stats = {
    totalTrades: closed.length,
    winRate: closed.length > 0 ? (closed.filter(e => parseFloat(e.pnl) > 0).length / closed.length * 100).toFixed(0) : null,
    avgPnl: closed.length > 0 ? (closed.reduce((sum, e) => sum + parseFloat(e.pnl), 0) / closed.length).toFixed(1) : null,
    totalDollarPnl: closed.length > 0 ? closed.reduce((sum, e) => sum + parseFloat(e.dollar_pnl || 0), 0) : null,
  };

  const handleExecute = async (id, data) => await onUpdate({ ...trades.find(e => e.id === id), ...data });
  const handleClose = async (id, data) => await onUpdate({ ...trades.find(e => e.id === id), ...data });

  return (
    <div style={{ minHeight: '100vh', background: colors.light, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Header title="Trade Journal" onBack={onBack} />
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}><SyncStatus status={syncStatus} /></div>
        
        <div style={{ background: colors.primary, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: colors.accent, fontWeight: 600, letterSpacing: '0.1em', marginBottom: 12 }}>PERFORMANCE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: colors.white }}>{stats.totalTrades}</div><div style={{ fontSize: 9, color: colors.neutral }}>TRADES</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: stats.winRate >= 50 ? colors.success : colors.danger }}>{stats.winRate || '—'}%</div><div style={{ fontSize: 9, color: colors.neutral }}>WIN RATE</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: parseFloat(stats.avgPnl) >= 0 ? colors.success : colors.danger }}>{stats.avgPnl || '—'}%</div><div style={{ fontSize: 9, color: colors.neutral }}>AVG P&L</div></div>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: stats.totalDollarPnl >= 0 ? colors.success : colors.danger }}>{stats.totalDollarPnl !== null ? `${stats.totalDollarPnl >= 0 ? '+' : ''}$${(stats.totalDollarPnl/1000).toFixed(1)}K` : '—'}</div><div style={{ fontSize: 9, color: colors.neutral }}>TOTAL $</div></div>
          </div>
        </div>

        <div style={{ display: 'flex', marginBottom: 14, background: colors.white, borderRadius: 10, padding: 4, border: `1px solid ${colors.border}` }}>
          {[{ key: 'pending', label: 'Pending', count: pending.length }, { key: 'open', label: 'Open', count: open.length }, { key: 'closed', label: 'Closed', count: closed.length }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '10px 8px', borderRadius: 8, border: 'none', background: tab === t.key ? colors.primary : 'transparent', color: tab === t.key ? colors.white : colors.neutral, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {t.label} {t.count > 0 && <span style={{ marginLeft: 4, background: tab === t.key ? 'rgba(255,255,255,0.2)' : colors.light, padding: '2px 6px', borderRadius: 10, fontSize: 10 }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'pending' && (pending.length === 0 ? <div style={{ textAlign: 'center', padding: 40, background: colors.white, borderRadius: 12, border: `1px solid ${colors.border}` }}><div style={{ fontSize: 32 }}>📋</div><div style={{ fontWeight: 600, color: colors.neutral }}>No pending trades</div></div> : pending.map(e => <PendingEntry key={e.id} entry={e} onUpdate={onUpdate} onExecute={handleExecute} onSkip={onDelete} onDelete={onDelete} />))}
        {tab === 'open' && (open.length === 0 ? <div style={{ textAlign: 'center', padding: 40, background: colors.white, borderRadius: 12, border: `1px solid ${colors.border}` }}><div style={{ fontSize: 32 }}>📈</div><div style={{ fontWeight: 600, color: colors.neutral }}>No open positions</div></div> : open.map(e => <OpenEntry key={e.id} entry={e} onClose={handleClose} onDelete={onDelete} />))}
        {tab === 'closed' && (closed.length === 0 ? <div style={{ textAlign: 'center', padding: 40, background: colors.white, borderRadius: 12, border: `1px solid ${colors.border}` }}><div style={{ fontSize: 32 }}>📊</div><div style={{ fontWeight: 600, color: colors.neutral }}>No closed trades</div></div> : closed.map(e => <ClosedEntry key={e.id} entry={e} />))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home');
  const [trades, setTrades] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [syncStatus, setSyncStatus] = useState('syncing');

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); });
    return () => subscription.unsubscribe();
  }, []);

  // Load data
  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    setSyncStatus('syncing');
    try {
      const { data: tradesData } = await supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setTrades(tradesData || []);
      const { data: watchlistData } = await supabase.from('watchlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setWatchlist(watchlistData || []);
      setSyncStatus('synced');
    } catch { setSyncStatus('error'); }
  };

  // CRUD operations
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
    if (!confirm('Delete?')) return;
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

  const handleLogout = async () => { await supabase.auth.signOut(); };

  // Loading state
  if (loading) return <div style={{ minHeight: '100vh', background: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Logo size="large" /></div>;

  // Auth screen
  if (!user) return <AuthScreen />;

  // Routes
  if (view === 'scorecard-a') return <Scorecard type="A" onLog={async (t) => { await addTrade(t); setView('journal'); }} onCancel={() => setView('home')} />;
  if (view === 'scorecard-b') return <Scorecard type="B" onLog={async (t) => { await addTrade(t); setView('journal'); }} onCancel={() => setView('home')} />;
  if (view === 'journal') return <Journal trades={trades} onUpdate={updateTrade} onDelete={deleteTrade} onBack={() => setView('home')} syncStatus={syncStatus} />;
  if (view === 'watchlist') return <Watchlist watchlist={watchlist} onAdd={addToWatchlist} onUpdate={updateWatchlistItem} onRemove={removeFromWatchlist} onBack={() => setView('home')} />;

  // Stats
  const pending = trades.filter(e => !e.executed && e.score >= 60).length;
  const open = trades.filter(e => e.executed && !e.pnl).length;
  const closed = trades.filter(e => e.executed && e.pnl !== null);
  const totalDollarPnl = closed.length > 0 ? closed.reduce((sum, e) => sum + parseFloat(e.dollar_pnl || 0), 0) : null;

  // Home
  return (
    <div style={{ minHeight: '100vh', background: colors.primary, paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{ maxWidth: 430, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <SyncStatus status={syncStatus} />
          <button onClick={handleLogout} style={{ fontSize: 12, color: colors.neutral, background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><Logo size="large" /></div>
          <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`, margin: '0 auto' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}><div style={{ fontSize: 26, fontWeight: 800, color: colors.warning }}>{pending}</div><div style={{ fontSize: 9, color: colors.neutral, letterSpacing: '0.1em', marginTop: 2 }}>PENDING</div></div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}><div style={{ fontSize: 26, fontWeight: 800, color: colors.typeA }}>{open}</div><div style={{ fontSize: 9, color: colors.neutral, letterSpacing: '0.1em', marginTop: 2 }}>OPEN</div></div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}><div style={{ fontSize: 26, fontWeight: 800, color: totalDollarPnl !== null ? (totalDollarPnl >= 0 ? colors.success : colors.danger) : colors.neutral }}>{totalDollarPnl !== null ? `${totalDollarPnl >= 0 ? '+' : ''}$${(totalDollarPnl/1000).toFixed(0)}K` : '—'}</div><div style={{ fontSize: 9, color: colors.neutral, letterSpacing: '0.1em', marginTop: 2 }}>TOTAL P&L</div></div>
        </div>

        <button onClick={() => setView('scorecard-a')} style={{ width: '100%', padding: 20, marginBottom: 10, background: colors.secondary, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(29, 78, 216, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 22 }}>⚡</span></div>
          <div><div style={{ color: colors.white, fontSize: 16, fontWeight: 700 }}>Type A: Tipping Point</div><div style={{ color: colors.neutral, fontSize: 12, marginTop: 2 }}>Catalyst-driven entry at inflection</div></div>
        </button>

        <button onClick={() => setView('scorecard-b')} style={{ width: '100%', padding: 20, marginBottom: 10, background: colors.secondary, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(4, 120, 87, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 22 }}>📉</span></div>
          <div><div style={{ color: colors.white, fontSize: 16, fontWeight: 700 }}>Type B: Pullback</div><div style={{ color: colors.neutral, fontSize: 12, marginTop: 2 }}>Re-entry on established trend</div></div>
        </button>

        <button onClick={() => setView('journal')} style={{ width: '100%', padding: 20, marginBottom: 10, background: 'transparent', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 22 }}>📊</span></div>
          <div><div style={{ color: colors.accent, fontSize: 16, fontWeight: 700 }}>Trade Journal</div><div style={{ color: colors.neutral, fontSize: 12, marginTop: 2 }}>Review & manage positions</div></div>
        </button>

        <button onClick={() => setView('watchlist')} style={{ width: '100%', padding: 20, marginBottom: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 22 }}>👀</span></div>
          <div><div style={{ color: colors.white, fontSize: 16, fontWeight: 700 }}>Watchlist</div><div style={{ color: colors.neutral, fontSize: 12, marginTop: 2 }}>{watchlist.length} tickers • Price alerts & news</div></div>
        </button>

        <div style={{ marginTop: 16, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 9, fontWeight: 600, marginBottom: 12, color: colors.neutral, letterSpacing: '0.1em' }}>POSITION SIZING ($K)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {[{ score: '<60', size: '$0', color: colors.danger }, { score: '60-69', size: '$10-25K', color: colors.warning }, { score: '70-79', size: '$25-50K', color: colors.typeA }, { score: '80-89', size: '$50-75K', color: colors.success }, { score: '90+', size: '$75-100K', color: colors.success }].map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: 11 }}>
                <span style={{ color: colors.neutral }}>{t.score}</span>
                <span style={{ color: t.color, fontWeight: 600 }}>{t.size}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, color: colors.neutral }}>Score your trades. Stay disciplined.</div>
        </div>
      </div>
    </div>
  );
}
