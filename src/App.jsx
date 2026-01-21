import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'trade_journal_entries';

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

const TYPE_A_CONFIG = {
  name: 'Tipping Point',
  sections: [
    { title: 'Catalyst Quality', maxPoints: 30, signals: [
      { id: 'catalyst_binary', label: 'Catalyst is binary/verifiable', max: 10, hints: ['10: Hard date/event', '7: Semi-hard', '4: Soft', '0: None'] },
      { id: 'catalyst_timing', label: 'Catalyst timing', max: 10, hints: ['10: <2 weeks', '7: 2-4 weeks', '4: 1-3 months', '0: Vague'] },
      { id: 'catalyst_priced', label: "Market hasn't priced it", max: 10, hints: ['10: Under-covered', '7: Variant view', '4: Magnitude diff', '0: Consensus'] },
    ]},
    { title: 'Technical Confirmation', maxPoints: 20, signals: [
      { id: 'breakout_quality', label: 'Breakout quality', max: 12, hints: ['12: Base + vol >150%', '9: Vol 100-150%', '5: Weak volume', '0: Chasing'] },
      { id: 'overhead_supply', label: 'Overhead supply', max: 8, hints: ['8: Minimal', '5: Some <15%', '2: Significant', '0: Massive'] },
    ]},
    { title: 'Fundamental Setup', maxPoints: 20, signals: [
      { id: 'thesis_clarity', label: 'Thesis clarity', max: 8, hints: ['8: One sentence edge', '5: Nuanced', '2: Fuzzy', '0: None'] },
      { id: 'earnings_inflection', label: 'Earnings/revenue inflection', max: 6, hints: ['6: Next Q inflection', '4: 2-3Q out', '2: Stable', '0: Deteriorating'] },
      { id: 'insider_signal', label: 'Management/insider signal', max: 6, hints: ['6: Recent buying', '4: Holding', '2: Unproven', '0: Selling'] },
    ]},
    { title: 'Risk Definition', maxPoints: 30, signals: [
      { id: 'stop_defined', label: 'Stop-loss defined', max: 12, hints: ['12: Tech + thesis stop', '9: Tech only', '5: Rough', '0: None'] },
      { id: 'size_calibrated', label: 'Position size calibrated', max: 10, hints: ['10: Max loss 1-2%', '6: Roughly ok', '3: Arbitrary', '0: Ignoring'] },
      { id: 'exit_target', label: 'Exit target & horizon', max: 8, hints: ['8: Both defined', '5: One defined', '2: Vague', '0: None'] },
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
  if (score < 60) return { text: 'NO TRADE', color: colors.danger, size: '0%', bg: '#fef2f2' };
  if (score < 70) return { text: 'LOW CONVICTION', color: colors.warning, size: '5-10%', bg: '#fffbeb' };
  if (score < 80) return { text: 'MEDIUM', color: colors.typeA, size: '10-20%', bg: '#eff6ff' };
  if (score < 90) return { text: 'HIGH CONVICTION', color: colors.success, size: '20-25%', bg: '#ecfdf5' };
  return { text: 'MAXIMUM', color: colors.success, size: '25-30%', bg: '#ecfdf5' };
}

function SignalInput({ signal, value, onChange }) {
  const [showHints, setShowHints] = useState(false);
  const pct = ((value || 0) / signal.max) * 100;
  return (
    <div style={{ marginBottom: 12, background: colors.light, borderRadius: 10, padding: 14, border: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: colors.primary, flex: 1 }}>{signal.label}</span>
        <button onClick={() => setShowHints(!showHints)} style={{ background: showHints ? colors.secondary : 'transparent', border: `1px solid ${colors.border}`, color: showHints ? colors.white : colors.neutral, fontSize: 11, cursor: 'pointer', padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>{showHints ? 'Hide' : 'Guide'}</button>
      </div>
      {showHints && (
        <div style={{ marginBottom: 12, padding: 10, background: colors.white, borderRadius: 6, border: `1px solid ${colors.border}` }}>
          {signal.hints.map((hint, i) => (<div key={i} style={{ fontSize: 12, color: colors.neutral, lineHeight: 1.7 }}>{hint}</div>))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 6, background: colors.border, borderRadius: 3, transform: 'translateY(-50%)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct > 70 ? colors.success : pct > 40 ? colors.warning : colors.danger, borderRadius: 3, transition: 'width 0.15s ease' }} />
          </div>
          <input type="range" min="0" max={signal.max} value={value || 0} onChange={(e) => onChange(parseInt(e.target.value))} style={{ width: '100%', opacity: 0, cursor: 'pointer', height: 28 }} />
        </div>
        <div style={{ minWidth: 50, textAlign: 'center', fontWeight: 700, fontSize: 14, color: pct > 70 ? colors.success : pct > 40 ? colors.warning : colors.danger, background: colors.white, padding: '6px 8px', borderRadius: 6, border: `1px solid ${colors.border}` }}>{value || 0}/{signal.max}</div>
      </div>
    </div>
  );
}

function Scorecard({ type, onLog, onCancel }) {
  const config = type === 'A' ? TYPE_A_CONFIG : TYPE_B_CONFIG;
  const [scores, setScores] = useState({});
  const [tradeInfo, setTradeInfo] = useState({ ticker: '', entry: '', stop: '', target: '', thesis: '' });
  const totalScore = Object.values(scores).reduce((sum, val) => sum + (val || 0), 0);
  const decision = getDecision(totalScore);
  const handleScoreChange = (signalId, value) => setScores(prev => ({ ...prev, [signalId]: value }));
  const handleLog = () => {
    if (!tradeInfo.ticker) { alert('Please enter a ticker'); return; }
    onLog({
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      ticker: tradeInfo.ticker.toUpperCase(),
      type,
      score: totalScore,
      decision: decision.text,
      suggestedSize: decision.size,
      plannedEntry: tradeInfo.entry,
      plannedStop: tradeInfo.stop,
      plannedTarget: tradeInfo.target,
      thesis: tradeInfo.thesis,
      // Execution fields - to be filled later
      executed: false,
      actualSize: null,
      actualEntry: null,
      actualExit: null,
      exitDate: null,
      pnl: null,
      notes: ''
    });
  };
  const inputStyle = { padding: 12, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 15, background: colors.white, color: colors.primary, width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: colors.light, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Header title={`Type ${type}: ${config.name}`} onBack={onCancel} />
      <div style={{ padding: 16, paddingBottom: 210 }}>
        <div style={{ background: colors.white, borderRadius: 12, padding: 16, marginBottom: 14, border: `1px solid ${colors.border}` }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 11, color: colors.neutral, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Trade Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input type="text" placeholder="Ticker *" value={tradeInfo.ticker} onChange={(e) => setTradeInfo(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))} style={{ ...inputStyle, fontWeight: 600 }} />
            <input type="number" placeholder="Planned Entry" value={tradeInfo.entry} onChange={(e) => setTradeInfo(prev => ({ ...prev, entry: e.target.value }))} style={inputStyle} />
            <input type="number" placeholder="Planned Stop" value={tradeInfo.stop} onChange={(e) => setTradeInfo(prev => ({ ...prev, stop: e.target.value }))} style={inputStyle} />
            <input type="number" placeholder="Planned Target" value={tradeInfo.target} onChange={(e) => setTradeInfo(prev => ({ ...prev, target: e.target.value }))} style={inputStyle} />
          </div>
          <textarea placeholder="Investment thesis..." value={tradeInfo.thesis} onChange={(e) => setTradeInfo(prev => ({ ...prev, thesis: e.target.value }))} style={{ ...inputStyle, marginTop: 10, resize: 'none', minHeight: 64, fontFamily: 'inherit' }} />
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
              {section.signals.map(signal => (<SignalInput key={signal.id} signal={signal} value={scores[signal.id]} onChange={(val) => handleScoreChange(signal.id, val)} />))}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: colors.white, borderTop: `1px solid ${colors.border}`, padding: 16, paddingBottom: 'max(16px, env(safe-area-inset-bottom))', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontSize: 40, fontWeight: 800, color: decision.color, lineHeight: 1 }}>{totalScore}</span>
            <span style={{ fontSize: 14, color: colors.neutral }}>/100</span>
          </div>
          <div style={{ textAlign: 'right', background: decision.bg, padding: '8px 14px', borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: decision.color }}>{decision.text}</div>
            <div style={{ fontSize: 12, color: colors.neutral }}>Size: {decision.size}</div>
          </div>
        </div>
        <button onClick={handleLog} disabled={totalScore < 60} style={{ width: '100%', padding: 14, background: totalScore >= 60 ? colors.primary : colors.border, color: totalScore >= 60 ? colors.white : colors.neutral, border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: totalScore >= 60 ? 'pointer' : 'not-allowed' }}>{totalScore < 60 ? 'Score Below 60' : 'Save to Journal →'}</button>
      </div>
    </div>
  );
}

function PendingEntry({ entry, onExecute, onSkip, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execData, setExecData] = useState({ actualSize: '', actualEntry: '' });
  const accent = entry.type === 'A' ? colors.typeA : colors.typeB;

  const handleExecute = () => {
    if (!execData.actualSize || !execData.actualEntry) { alert('Please fill in actual size and entry price'); return; }
    onExecute(entry.id, { actualSize: execData.actualSize, actualEntry: execData.actualEntry, executed: true });
    setExecuting(false);
  };

  return (
    <div style={{ background: colors.white, borderRadius: 12, marginBottom: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: 14, cursor: 'pointer', borderLeft: `4px solid ${accent}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: colors.primary }}>{entry.ticker}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: entry.type === 'A' ? '#eff6ff' : '#ecfdf5', color: accent, fontWeight: 600 }}>{entry.type === 'A' ? 'TIPPING' : 'PULLBACK'}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#fffbeb', color: colors.warning, fontWeight: 600 }}>PENDING</span>
            </div>
            <div style={{ fontSize: 11, color: colors.neutral }}>{entry.date} • Score: {entry.score}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.primary }}>{entry.suggestedSize}</div>
            <div style={{ fontSize: 10, color: colors.neutral }}>suggested</div>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${colors.border}` }}>
          {executing ? (
            <div style={{ paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: colors.neutral, marginBottom: 8, fontWeight: 600 }}>RECORD EXECUTION</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: colors.neutral }}>Actual Size %</label>
                  <input type="text" placeholder="e.g. 15%" value={execData.actualSize} onChange={(e) => setExecData(prev => ({ ...prev, actualSize: e.target.value }))} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, boxSizing: 'border-box', marginTop: 4, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: colors.neutral }}>Actual Entry Price</label>
                  <input type="number" placeholder="Entry price" value={execData.actualEntry} onChange={(e) => setExecData(prev => ({ ...prev, actualEntry: e.target.value }))} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, boxSizing: 'border-box', marginTop: 4, fontSize: 13 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleExecute} style={{ flex: 1, padding: 11, background: colors.success, color: colors.white, border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Confirm Entry</button>
                <button onClick={() => setExecuting(false)} style={{ flex: 1, padding: 11, background: colors.light, color: colors.neutral, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: colors.primary, marginBottom: 8 }}><span style={{ color: colors.neutral }}>Thesis:</span> {entry.thesis || '—'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 11, marginBottom: 12, background: colors.light, padding: 10, borderRadius: 6 }}>
                <div><span style={{ color: colors.neutral }}>Plan Entry:</span> <strong>{entry.plannedEntry || '—'}</strong></div>
                <div><span style={{ color: colors.neutral }}>Plan Stop:</span> <strong>{entry.plannedStop || '—'}</strong></div>
                <div><span style={{ color: colors.neutral }}>Plan Target:</span> <strong>{entry.plannedTarget || '—'}</strong></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setExecuting(true)} style={{ flex: 1, padding: 11, background: colors.success, color: colors.white, border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>I Took This Trade</button>
                <button onClick={() => onSkip(entry.id)} style={{ flex: 1, padding: 11, background: colors.light, color: colors.neutral, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13 }}>Skipped</button>
                <button onClick={() => onDelete(entry.id)} style={{ padding: '11px 14px', background: '#fef2f2', color: colors.danger, border: 'none', borderRadius: 8, fontSize: 13 }}>✕</button>
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

  const handleClose = () => {
    if (!closeData.actualExit) { alert('Please enter exit price'); return; }
    const pnl = ((parseFloat(closeData.actualExit) - parseFloat(entry.actualEntry)) / parseFloat(entry.actualEntry) * 100).toFixed(2);
    onClose(entry.id, { actualExit: closeData.actualExit, exitDate: closeData.exitDate, pnl, notes: closeData.notes });
    setClosing(false);
  };

  return (
    <div style={{ background: colors.white, borderRadius: 12, marginBottom: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: 14, cursor: 'pointer', borderLeft: `4px solid ${accent}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: colors.primary }}>{entry.ticker}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: entry.type === 'A' ? '#eff6ff' : '#ecfdf5', color: accent, fontWeight: 600 }}>{entry.type === 'A' ? 'TIPPING' : 'PULLBACK'}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#dbeafe', color: colors.typeA, fontWeight: 600 }}>OPEN</span>
            </div>
            <div style={{ fontSize: 11, color: colors.neutral }}>{entry.date} • Score: {entry.score} • Entry: {entry.actualEntry}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.primary }}>{entry.actualSize}</div>
            <div style={{ fontSize: 10, color: colors.neutral }}>position</div>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${colors.border}` }}>
          {closing ? (
            <div style={{ paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: colors.neutral, marginBottom: 8, fontWeight: 600 }}>CLOSE POSITION</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 10, color: colors.neutral }}>Exit Price</label>
                  <input type="number" value={closeData.actualExit} onChange={(e) => setCloseData(prev => ({ ...prev, actualExit: e.target.value }))} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, boxSizing: 'border-box', marginTop: 4, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: colors.neutral }}>Exit Date</label>
                  <input type="date" value={closeData.exitDate} onChange={(e) => setCloseData(prev => ({ ...prev, exitDate: e.target.value }))} style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, boxSizing: 'border-box', marginTop: 4, fontSize: 13 }} />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 10, color: colors.neutral }}>Notes / Lessons</label>
                <textarea value={closeData.notes} onChange={(e) => setCloseData(prev => ({ ...prev, notes: e.target.value }))} placeholder="What did you learn?" style={{ width: '100%', padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6, resize: 'none', minHeight: 50, boxSizing: 'border-box', marginTop: 4, fontSize: 13, fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleClose} style={{ flex: 1, padding: 11, background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Close Position</button>
                <button onClick={() => setClosing(false)} style={{ flex: 1, padding: 11, background: colors.light, color: colors.neutral, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: colors.primary, marginBottom: 8 }}><span style={{ color: colors.neutral }}>Thesis:</span> {entry.thesis || '—'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 11, marginBottom: 12, background: colors.light, padding: 10, borderRadius: 6 }}>
                <div><span style={{ color: colors.neutral }}>Entry:</span> <strong>{entry.actualEntry}</strong></div>
                <div><span style={{ color: colors.neutral }}>Stop:</span> <strong>{entry.plannedStop || '—'}</strong></div>
                <div><span style={{ color: colors.neutral }}>Target:</span> <strong>{entry.plannedTarget || '—'}</strong></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setClosing(true)} style={{ flex: 1, padding: 11, background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Close Position</button>
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
  const accent = entry.type === 'A' ? colors.typeA : colors.typeB;
  const pnlNum = parseFloat(entry.pnl);

  return (
    <div style={{ background: colors.white, borderRadius: 12, marginBottom: 10, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: 14, cursor: 'pointer', borderLeft: `4px solid ${accent}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: colors.primary }}>{entry.ticker}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: entry.type === 'A' ? '#eff6ff' : '#ecfdf5', color: accent, fontWeight: 600 }}>{entry.type === 'A' ? 'TIPPING' : 'PULLBACK'}</span>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: pnlNum >= 0 ? '#ecfdf5' : '#fef2f2', color: pnlNum >= 0 ? colors.success : colors.danger, fontWeight: 600 }}>{pnlNum >= 0 ? 'WIN' : 'LOSS'}</span>
            </div>
            <div style={{ fontSize: 11, color: colors.neutral }}>{entry.date} → {entry.exitDate} • Score: {entry.score}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: pnlNum >= 0 ? colors.success : colors.danger }}>{pnlNum >= 0 ? '+' : ''}{entry.pnl}%</div>
            <div style={{ fontSize: 10, color: colors.neutral }}>{entry.actualSize}</div>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${colors.border}` }}>
          <div style={{ paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: colors.primary, marginBottom: 8 }}><span style={{ color: colors.neutral }}>Thesis:</span> {entry.thesis || '—'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: 11, marginBottom: 8, background: colors.light, padding: 10, borderRadius: 6 }}>
              <div><span style={{ color: colors.neutral }}>Entry:</span> <strong>{entry.actualEntry}</strong></div>
              <div><span style={{ color: colors.neutral }}>Exit:</span> <strong>{entry.actualExit}</strong></div>
            </div>
            {entry.notes && <div style={{ fontSize: 11, color: colors.neutral, padding: 10, background: colors.light, borderRadius: 6 }}><strong>Notes:</strong> {entry.notes}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function Journal({ entries, onUpdate, onDelete, onBack }) {
  const [tab, setTab] = useState('pending');
  
  const pending = entries.filter(e => !e.executed && e.score >= 60).sort((a, b) => new Date(b.date) - new Date(a.date));
  const open = entries.filter(e => e.executed && !e.pnl).sort((a, b) => new Date(b.date) - new Date(a.date));
  const closed = entries.filter(e => e.executed && e.pnl !== null).sort((a, b) => new Date(b.exitDate) - new Date(a.exitDate));

  // Stats only from closed trades with actual P&L
  const stats = {
    totalTrades: closed.length,
    wins: closed.filter(e => parseFloat(e.pnl) > 0).length,
    winRate: closed.length > 0 ? (closed.filter(e => parseFloat(e.pnl) > 0).length / closed.length * 100).toFixed(0) : null,
    avgPnl: closed.length > 0 ? (closed.reduce((sum, e) => sum + parseFloat(e.pnl), 0) / closed.length).toFixed(1) : null,
    totalPnl: closed.length > 0 ? closed.reduce((sum, e) => sum + parseFloat(e.pnl), 0).toFixed(1) : null,
    avgScore: closed.length > 0 ? (closed.reduce((sum, e) => sum + e.score, 0) / closed.length).toFixed(0) : null,
    highScoreAvgPnl: closed.filter(e => e.score >= 80).length > 0 ? (closed.filter(e => e.score >= 80).reduce((sum, e) => sum + parseFloat(e.pnl), 0) / closed.filter(e => e.score >= 80).length).toFixed(1) : null,
    lowScoreAvgPnl: closed.filter(e => e.score < 80).length > 0 ? (closed.filter(e => e.score < 80).reduce((sum, e) => sum + parseFloat(e.pnl), 0) / closed.filter(e => e.score < 80).length).toFixed(1) : null
  };

  const handleExecute = (id, data) => onUpdate({ ...entries.find(e => e.id === id), ...data });
  const handleSkip = (id) => onDelete(id);
  const handleClose = (id, data) => onUpdate({ ...entries.find(e => e.id === id), ...data });

  return (
    <div style={{ minHeight: '100vh', background: colors.light, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Header title="Trade Journal" onBack={onBack} />
      <div style={{ padding: 16 }}>
        {/* Performance Stats - Only from closed trades */}
        <div style={{ background: colors.primary, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: colors.accent, fontWeight: 600, letterSpacing: '0.1em', marginBottom: 12 }}>ACTUAL PERFORMANCE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: colors.white }}>{stats.totalTrades}</div>
              <div style={{ fontSize: 9, color: colors.neutral }}>TRADES</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: stats.winRate >= 50 ? colors.success : colors.danger }}>{stats.winRate || '—'}%</div>
              <div style={{ fontSize: 9, color: colors.neutral }}>WIN RATE</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: parseFloat(stats.avgPnl) >= 0 ? colors.success : colors.danger }}>{stats.avgPnl || '—'}%</div>
              <div style={{ fontSize: 9, color: colors.neutral }}>AVG P&L</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: parseFloat(stats.totalPnl) >= 0 ? colors.success : colors.danger }}>{stats.totalPnl ? `${parseFloat(stats.totalPnl) >= 0 ? '+' : ''}${stats.totalPnl}%` : '—'}</div>
              <div style={{ fontSize: 9, color: colors.neutral }}>TOTAL</div>
            </div>
          </div>
          {closed.length >= 3 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 6 }}>
                  <div style={{ color: colors.neutral, marginBottom: 2 }}>High Score (80+) Avg P&L</div>
                  <div style={{ color: stats.highScoreAvgPnl && parseFloat(stats.highScoreAvgPnl) >= 0 ? colors.success : colors.danger, fontWeight: 700 }}>{stats.highScoreAvgPnl || '—'}%</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 6 }}>
                  <div style={{ color: colors.neutral, marginBottom: 2 }}>Low Score (60-79) Avg P&L</div>
                  <div style={{ color: stats.lowScoreAvgPnl && parseFloat(stats.lowScoreAvgPnl) >= 0 ? colors.success : colors.danger, fontWeight: 700 }}>{stats.lowScoreAvgPnl || '—'}%</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 14, background: colors.white, borderRadius: 10, padding: 4, border: `1px solid ${colors.border}` }}>
          {[
            { key: 'pending', label: 'Pending', count: pending.length },
            { key: 'open', label: 'Open', count: open.length },
            { key: 'closed', label: 'Closed', count: closed.length }
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '10px 8px', borderRadius: 8, border: 'none', background: tab === t.key ? colors.primary : 'transparent', color: tab === t.key ? colors.white : colors.neutral, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {t.label} {t.count > 0 && <span style={{ marginLeft: 4, background: tab === t.key ? 'rgba(255,255,255,0.2)' : colors.light, padding: '2px 6px', borderRadius: 10, fontSize: 10 }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'pending' && (
          pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: colors.neutral, background: colors.white, borderRadius: 12, border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ fontWeight: 600 }}>No pending trades</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Score a trade to see it here</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: colors.neutral, marginBottom: 10, padding: '0 4px' }}>Trades scored but not yet executed. Record your actual entry when you take the trade.</div>
              {pending.map(e => <PendingEntry key={e.id} entry={e} onExecute={handleExecute} onSkip={handleSkip} onDelete={onDelete} />)}
            </>
          )
        )}

        {tab === 'open' && (
          open.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: colors.neutral, background: colors.white, borderRadius: 12, border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📈</div>
              <div style={{ fontWeight: 600 }}>No open positions</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Execute a pending trade to track it here</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: colors.neutral, marginBottom: 10, padding: '0 4px' }}>Active positions. Close them when you exit to record your P&L.</div>
              {open.map(e => <OpenEntry key={e.id} entry={e} onClose={handleClose} onDelete={onDelete} />)}
            </>
          )
        )}

        {tab === 'closed' && (
          closed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: colors.neutral, background: colors.white, borderRadius: 12, border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <div style={{ fontWeight: 600 }}>No closed trades yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Close an open position to see your performance</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: colors.neutral, marginBottom: 10, padding: '0 4px' }}>Completed trades with final P&L. These feed your performance stats.</div>
              {closed.map(e => <ClosedEntry key={e.id} entry={e} />)}
            </>
          )
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('home');
  const [entries, setEntries] = useState([]);
  useEffect(() => { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setEntries(JSON.parse(saved)); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }, [entries]);
  const handleLog = (entry) => { setEntries(prev => [...prev, entry]); setView('journal'); };
  const handleUpdate = (updated) => setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
  const handleDelete = (id) => { if (confirm('Delete this entry?')) setEntries(prev => prev.filter(e => e.id !== id)); };

  if (view === 'scorecard-a') return <Scorecard type="A" onLog={handleLog} onCancel={() => setView('home')} />;
  if (view === 'scorecard-b') return <Scorecard type="B" onLog={handleLog} onCancel={() => setView('home')} />;
  if (view === 'journal') return <Journal entries={entries} onUpdate={handleUpdate} onDelete={handleDelete} onBack={() => setView('home')} />;

  const pending = entries.filter(e => !e.executed && e.score >= 60).length;
  const open = entries.filter(e => e.executed && !e.pnl).length;
  const closed = entries.filter(e => e.executed && e.pnl !== null);
  const totalPnl = closed.length > 0 ? closed.reduce((sum, e) => sum + parseFloat(e.pnl), 0).toFixed(1) : null;

  return (
    <div style={{ minHeight: '100vh', background: colors.primary, paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{ maxWidth: 430, margin: '0 auto', padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 36, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><Logo size="large" /></div>
          <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`, margin: '0 auto' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: colors.warning }}>{pending}</div>
            <div style={{ fontSize: 9, color: colors.neutral, fontWeight: 500, letterSpacing: '0.1em', marginTop: 2 }}>PENDING</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: colors.typeA }}>{open}</div>
            <div style={{ fontSize: 9, color: colors.neutral, fontWeight: 500, letterSpacing: '0.1em', marginTop: 2 }}>OPEN</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: totalPnl !== null ? (parseFloat(totalPnl) >= 0 ? colors.success : colors.danger) : colors.neutral }}>{totalPnl !== null ? `${parseFloat(totalPnl) >= 0 ? '+' : ''}${totalPnl}%` : '—'}</div>
            <div style={{ fontSize: 9, color: colors.neutral, fontWeight: 500, letterSpacing: '0.1em', marginTop: 2 }}>TOTAL P&L</div>
          </div>
        </div>
        <button onClick={() => setView('scorecard-a')} style={{ width: '100%', padding: 20, marginBottom: 10, background: colors.secondary, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(29, 78, 216, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 22 }}>⚡</span></div>
          <div><div style={{ color: colors.white, fontSize: 16, fontWeight: 700 }}>Type A: Tipping Point</div><div style={{ color: colors.neutral, fontSize: 12, marginTop: 2 }}>Catalyst-driven entry at inflection</div></div>
        </button>
        <button onClick={() => setView('scorecard-b')} style={{ width: '100%', padding: 20, marginBottom: 10, background: colors.secondary, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(4, 120, 87, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 22 }}>📉</span></div>
          <div><div style={{ color: colors.white, fontSize: 16, fontWeight: 700 }}>Type B: Pullback</div><div style={{ color: colors.neutral, fontSize: 12, marginTop: 2 }}>Re-entry on established trend</div></div>
        </button>
        <button onClick={() => setView('journal')} style={{ width: '100%', padding: 20, background: 'transparent', border: `1px solid rgba(212, 175, 55, 0.3)`, borderRadius: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 22 }}>📊</span></div>
          <div><div style={{ color: colors.accent, fontSize: 16, fontWeight: 700 }}>Trade Journal</div><div style={{ color: colors.neutral, fontSize: 12, marginTop: 2 }}>Review & manage positions</div></div>
        </button>
        <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 9, fontWeight: 600, marginBottom: 12, color: colors.neutral, letterSpacing: '0.1em' }}>POSITION SIZING THRESHOLDS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {[{ score: '<60', size: 'No Trade', color: colors.danger }, { score: '60-69', size: '5-10%', color: colors.warning }, { score: '70-79', size: '10-20%', color: colors.typeA }, { score: '80-89', size: '20-25%', color: colors.success }, { score: '90+', size: '25-30%', color: colors.success }].map((t, i) => (
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
