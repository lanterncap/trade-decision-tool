import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'trade_journal_entries';

const TYPE_A_CONFIG = {
  name: 'Tipping Point',
  color: 'blue',
  sections: [
    {
      title: 'Catalyst Quality',
      maxPoints: 30,
      signals: [
        { id: 'catalyst_binary', label: 'Catalyst is binary/verifiable', max: 10, hints: ['10: Hard date/event', '7: Semi-hard', '4: Soft', '0: None'] },
        { id: 'catalyst_timing', label: 'Catalyst timing', max: 10, hints: ['10: <2 weeks', '7: 2-4 weeks', '4: 1-3 months', '0: Vague'] },
        { id: 'catalyst_priced', label: "Market hasn't priced it", max: 10, hints: ['10: Under-covered', '7: Variant view', '4: Magnitude diff', '0: Consensus'] },
      ]
    },
    {
      title: 'Technical Confirmation',
      maxPoints: 20,
      signals: [
        { id: 'breakout_quality', label: 'Breakout quality', max: 12, hints: ['12: Base + vol >150%', '9: Vol 100-150%', '5: Weak volume', '0: Chasing'] },
        { id: 'overhead_supply', label: 'Overhead supply', max: 8, hints: ['8: Minimal', '5: Some <15%', '2: Significant', '0: Massive'] },
      ]
    },
    {
      title: 'Fundamental Setup',
      maxPoints: 20,
      signals: [
        { id: 'thesis_clarity', label: 'Thesis clarity', max: 8, hints: ['8: One sentence edge', '5: Nuanced', '2: Fuzzy', '0: None'] },
        { id: 'earnings_inflection', label: 'Earnings/revenue inflection', max: 6, hints: ['6: Next Q inflection', '4: 2-3Q out', '2: Stable', '0: Deteriorating'] },
        { id: 'insider_signal', label: 'Management/insider signal', max: 6, hints: ['6: Recent buying', '4: Holding', '2: Unproven', '0: Selling'] },
      ]
    },
    {
      title: 'Risk Definition',
      maxPoints: 30,
      signals: [
        { id: 'stop_defined', label: 'Stop-loss defined', max: 12, hints: ['12: Tech + thesis stop', '9: Tech only', '5: Rough', '0: None'] },
        { id: 'size_calibrated', label: 'Position size calibrated', max: 10, hints: ['10: Max loss 1-2%', '6: Roughly ok', '3: Arbitrary', '0: Ignoring'] },
        { id: 'exit_target', label: 'Exit target & horizon', max: 8, hints: ['8: Both defined', '5: One defined', '2: Vague', '0: None'] },
      ]
    }
  ]
};

const TYPE_B_CONFIG = {
  name: 'Pullback',
  color: 'green',
  sections: [
    {
      title: 'Trend Quality',
      maxPoints: 25,
      signals: [
        { id: 'thesis_intact', label: 'Original thesis intact', max: 10, hints: ['10: Unchanged', '7: Minor concerns', '4: Degraded', '0: Broken'] },
        { id: 'prior_breakout', label: 'Prior breakout quality', max: 8, hints: ['8: Textbook', '5: Solid', '2: Weak', '0: Never broke out'] },
        { id: 'price_structure', label: 'Price structure', max: 7, hints: ['7: Above 21 EMA', '5: Testing 50 MA', '2: Below 50', '0: Broken'] },
      ]
    },
    {
      title: 'Pullback Quality',
      maxPoints: 25,
      signals: [
        { id: 'volume_contraction', label: 'Volume contraction', max: 10, hints: ['10: <50% of breakout', '7: Lighter', '4: Similar', '0: Increasing'] },
        { id: 'support_quality', label: 'Support quality', max: 9, hints: ['9: Confluence', '6: Single clear', '3: Near support', '0: None'] },
        { id: 'news_check', label: 'News check', max: 6, hints: ['6: No bad news', '4: Minor', '2: Concerning', '0: Thesis impaired'] },
      ]
    },
    {
      title: 'Re-entry Timing',
      maxPoints: 20,
      signals: [
        { id: 'stabilization', label: 'Stabilization evidence', max: 10, hints: ['10: Reversal signal', '7: Stabilizing', '4: Early', '0: Falling knife'] },
        { id: 'risk_reward', label: 'Risk/reward check', max: 10, hints: ['10: R/R >3:1', '7: 2-3:1', '4: ~1.5:1', '0: <1.5:1'] },
      ]
    },
    {
      title: 'Risk Definition',
      maxPoints: 30,
      signals: [
        { id: 'stop_below', label: 'Stop below support', max: 12, hints: ['12: Just below invalidation', '9: Defined', '5: Rough', '0: None'] },
        { id: 'size_volatility', label: 'Size vs. volatility', max: 10, hints: ['10: Stop-out = 1-2% loss', '6: Roughly ok', '3: Arbitrary', '0: Ignoring'] },
        { id: 'target_defined', label: 'Target defined', max: 8, hints: ['8: Target + horizon', '5: Rough target', '2: Vague', '0: None'] },
      ]
    }
  ]
};

function getDecision(score) {
  if (score < 60) return { text: 'NO TRADE', color: '#dc2626', size: '0%' };
  if (score < 70) return { text: 'LOW CONVICTION', color: '#f59e0b', size: '5-10%' };
  if (score < 80) return { text: 'MEDIUM CONVICTION', color: '#3b82f6', size: '10-20%' };
  if (score < 90) return { text: 'HIGH CONVICTION', color: '#10b981', size: '20-25%' };
  return { text: 'MAX CONVICTION', color: '#059669', size: '25-30%' };
}

function SignalInput({ signal, value, onChange }) {
  const [showHints, setShowHints] = useState(false);
  
  return (
    <div style={{ marginBottom: 16, background: '#f8fafc', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#334155', flex: 1 }}>{signal.label}</span>
        <button
          onClick={() => setShowHints(!showHints)}
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', padding: '4px 8px' }}
        >
          {showHints ? '▲' : '▼'}
        </button>
      </div>
      {showHints && (
        <div style={{ marginBottom: 8, paddingLeft: 8, borderLeft: '2px solid #e2e8f0' }}>
          {signal.hints.map((hint, i) => (
            <div key={i} style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>{hint}</div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="range"
          min="0"
          max={signal.max}
          value={value || 0}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{ flex: 1, accentColor: '#3b82f6' }}
        />
        <div style={{ 
          minWidth: 48, 
          textAlign: 'center', 
          fontWeight: 600, 
          fontSize: 16,
          color: value > signal.max * 0.7 ? '#10b981' : value > signal.max * 0.4 ? '#f59e0b' : '#dc2626'
        }}>
          {value || 0}/{signal.max}
        </div>
      </div>
    </div>
  );
}

function Scorecard({ type, onLog, onCancel }) {
  const config = type === 'A' ? TYPE_A_CONFIG : TYPE_B_CONFIG;
  const accentColor = type === 'A' ? '#3b82f6' : '#10b981';
  
  const [scores, setScores] = useState({});
  const [tradeInfo, setTradeInfo] = useState({
    ticker: '',
    entry: '',
    stop: '',
    target: '',
    thesis: '',
    actualSize: ''
  });

  const totalScore = Object.values(scores).reduce((sum, val) => sum + (val || 0), 0);
  const decision = getDecision(totalScore);

  const handleScoreChange = (signalId, value) => {
    setScores(prev => ({ ...prev, [signalId]: value }));
  };

  const handleLog = () => {
    if (!tradeInfo.ticker) {
      alert('Please enter a ticker');
      return;
    }
    
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      ticker: tradeInfo.ticker.toUpperCase(),
      type,
      score: totalScore,
      decision: decision.text,
      suggestedSize: decision.size,
      actualSize: tradeInfo.actualSize,
      entry: tradeInfo.entry,
      stop: tradeInfo.stop,
      target: tradeInfo.target,
      thesis: tradeInfo.thesis,
      status: 'Open',
      exitDate: null,
      exitPrice: null,
      pnl: null,
      notes: ''
    };
    
    onLog(entry);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <div style={{ 
        background: accentColor, 
        padding: '16px 20px', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
            ← Back
          </button>
          <h1 style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: 0 }}>Type {type}: {config.name}</h1>
          <div style={{ width: 60 }} />
        </div>
      </div>

      <div style={{ padding: 16, paddingBottom: 200 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Trade Info</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              type="text"
              placeholder="Ticker *"
              value={tradeInfo.ticker}
              onChange={(e) => setTradeInfo(prev => ({ ...prev, ticker: e.target.value }))}
              style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 16 }}
            />
            <input
              type="number"
              placeholder="Entry Price"
              value={tradeInfo.entry}
              onChange={(e) => setTradeInfo(prev => ({ ...prev, entry: e.target.value }))}
              style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 16 }}
            />
            <input
              type="number"
              placeholder="Stop Price"
              value={tradeInfo.stop}
              onChange={(e) => setTradeInfo(prev => ({ ...prev, stop: e.target.value }))}
              style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 16 }}
            />
            <input
              type="number"
              placeholder="Target Price"
              value={tradeInfo.target}
              onChange={(e) => setTradeInfo(prev => ({ ...prev, target: e.target.value }))}
              style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 16 }}
            />
          </div>
          <textarea
            placeholder="Thesis (1-2 sentences)"
            value={tradeInfo.thesis}
            onChange={(e) => setTradeInfo(prev => ({ ...prev, thesis: e.target.value }))}
            style={{ width: '100%', marginTop: 12, padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, resize: 'none', minHeight: 60, boxSizing: 'border-box' }}
          />
        </div>

        {config.sections.map((section, sectionIdx) => {
          const sectionScore = section.signals.reduce((sum, sig) => sum + (scores[sig.id] || 0), 0);
          return (
            <div key={sectionIdx} style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{section.title}</h3>
                <span style={{ 
                  background: sectionScore >= section.maxPoints * 0.7 ? '#dcfce7' : sectionScore >= section.maxPoints * 0.5 ? '#fef3c7' : '#fee2e2',
                  color: sectionScore >= section.maxPoints * 0.7 ? '#166534' : sectionScore >= section.maxPoints * 0.5 ? '#92400e' : '#dc2626',
                  padding: '4px 10px', 
                  borderRadius: 12, 
                  fontSize: 13, 
                  fontWeight: 600 
                }}>
                  {sectionScore}/{section.maxPoints}
                </span>
              </div>
              {section.signals.map(signal => (
                <SignalInput
                  key={signal.id}
                  signal={signal}
                  value={scores[signal.id]}
                  onChange={(val) => handleScoreChange(signal.id, val)}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        background: 'white', 
        borderTop: '1px solid #e2e8f0',
        padding: 16,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, color: decision.color }}>{totalScore}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>/ 100</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: decision.color }}>{decision.text}</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>Size: {decision.size}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Actual size %"
            value={tradeInfo.actualSize}
            onChange={(e) => setTradeInfo(prev => ({ ...prev, actualSize: e.target.value }))}
            style={{ flex: 1, padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
          />
          <button
            onClick={handleLog}
            disabled={totalScore < 60}
            style={{
              flex: 2,
              padding: 14,
              background: totalScore >= 60 ? accentColor : '#cbd5e1',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: totalScore >= 60 ? 'pointer' : 'not-allowed'
            }}
          >
            {totalScore < 60 ? 'Score Too Low' : 'Log Trade →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function JournalEntry({ entry, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ ...entry });

  const pnl = entry.exitPrice && entry.entry 
    ? ((parseFloat(entry.exitPrice) - parseFloat(entry.entry)) / parseFloat(entry.entry) * 100).toFixed(1)
    : null;

  const handleSave = () => {
    const updatedEntry = { ...editData };
    if (updatedEntry.exitPrice && updatedEntry.entry) {
      updatedEntry.pnl = ((parseFloat(updatedEntry.exitPrice) - parseFloat(updatedEntry.entry)) / parseFloat(updatedEntry.entry) * 100).toFixed(1);
    }
    onUpdate(updatedEntry);
    setEditing(false);
  };

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: 12, 
      marginBottom: 12, 
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${entry.type === 'A' ? '#3b82f6' : '#10b981'}`
    }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ padding: 16, cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{entry.ticker}</span>
              <span style={{ 
                fontSize: 11, 
                padding: '2px 6px', 
                borderRadius: 4, 
                background: entry.type === 'A' ? '#dbeafe' : '#dcfce7',
                color: entry.type === 'A' ? '#1d4ed8' : '#166534'
              }}>
                {entry.type === 'A' ? 'Tipping' : 'Pullback'}
              </span>
              <span style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 4,
                background: entry.status === 'Open' ? '#fef3c7' : entry.status === 'Closed' ? '#dcfce7' : '#fee2e2',
                color: entry.status === 'Open' ? '#92400e' : entry.status === 'Closed' ? '#166534' : '#dc2626'
              }}>
                {entry.status}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{entry.date} • Score: {entry.score}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {pnl !== null && (
              <div style={{ 
                fontSize: 18, 
                fontWeight: 700, 
                color: parseFloat(pnl) >= 0 ? '#10b981' : '#dc2626' 
              }}>
                {parseFloat(pnl) >= 0 ? '+' : ''}{pnl}%
              </div>
            )}
            <div style={{ fontSize: 12, color: '#64748b' }}>{entry.actualSize || entry.suggestedSize}</div>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
          {editing ? (
            <div style={{ paddingTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b' }}>Status</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6 }}
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="Stopped">Stopped</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b' }}>Exit Date</label>
                  <input
                    type="date"
                    value={editData.exitDate || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, exitDate: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b' }}>Exit Price</label>
                  <input
                    type="number"
                    value={editData.exitPrice || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, exitPrice: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b' }}>Actual Size</label>
                  <input
                    type="text"
                    value={editData.actualSize || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, actualSize: e.target.value }))}
                    style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: '#64748b' }}>Notes</label>
                <textarea
                  value={editData.notes || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6, resize: 'none', minHeight: 60, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSave} style={{ flex: 1, padding: 10, background: '#10b981', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600 }}>Save</button>
                <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 10, background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: 12 }}>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>
                <strong>Thesis:</strong> {entry.thesis || '—'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                <div>Entry: {entry.entry || '—'}</div>
                <div>Stop: {entry.stop || '—'}</div>
                <div>Target: {entry.target || '—'}</div>
              </div>
              {entry.notes && (
                <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 12 }}>
                  Notes: {entry.notes}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(true)} style={{ flex: 1, padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, fontWeight: 500 }}>Edit</button>
                <button onClick={() => onDelete(entry.id)} style={{ padding: 10, background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6 }}>Delete</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Journal({ entries, onUpdate, onDelete, onBack }) {
  const [filter, setFilter] = useState('all');
  
  const filtered = entries.filter(e => {
    if (filter === 'open') return e.status === 'Open';
    if (filter === 'closed') return e.status !== 'Open';
    if (filter === 'A') return e.type === 'A';
    if (filter === 'B') return e.type === 'B';
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const closedEntries = entries.filter(e => e.pnl !== null);
  const stats = {
    total: entries.length,
    open: entries.filter(e => e.status === 'Open').length,
    winRate: closedEntries.length > 0
      ? (closedEntries.filter(e => parseFloat(e.pnl) > 0).length / closedEntries.length * 100).toFixed(0)
      : null,
    avgPnl: closedEntries.length > 0
      ? (closedEntries.reduce((sum, e) => sum + parseFloat(e.pnl), 0) / closedEntries.length).toFixed(1)
      : null
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <div style={{ 
        background: '#1e293b', 
        padding: '16px 20px', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
            ← Back
          </button>
          <h1 style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: 0 }}>Trade Journal</h1>
          <div style={{ width: 60 }} />
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ 
          background: 'white', 
          borderRadius: 12, 
          padding: 16, 
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b' }}>{stats.total}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Total</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{stats.open}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Open</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: stats.winRate >= 50 ? '#10b981' : '#dc2626' }}>{stats.winRate || '—'}%</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Win Rate</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: stats.avgPnl >= 0 ? '#10b981' : '#dc2626' }}>{stats.avgPnl ? `${stats.avgPnl}%` : '—'}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Avg P&L</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'open', label: 'Open' },
            { key: 'closed', label: 'Closed' },
            { key: 'A', label: 'Type A' },
            { key: 'B', label: 'Type B' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: filter === f.key ? '#1e293b' : 'white',
                color: filter === f.key ? 'white' : '#475569',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            No trades yet
          </div>
        ) : (
          filtered.map(entry => (
            <JournalEntry 
              key={entry.id} 
              entry={entry} 
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('home');
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const handleLog = (entry) => {
    setEntries(prev => [...prev, entry]);
    setView('journal');
  };

  const handleUpdate = (updatedEntry) => {
    setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };

  const handleDelete = (id) => {
    if (confirm('Delete this trade?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  if (view === 'scorecard-a') {
    return <Scorecard type="A" onLog={handleLog} onCancel={() => setView('home')} />;
  }

  if (view === 'scorecard-b') {
    return <Scorecard type="B" onLog={handleLog} onCancel={() => setView('home')} />;
  }

  if (view === 'journal') {
    return <Journal entries={entries} onUpdate={handleUpdate} onDelete={handleDelete} onBack={() => setView('home')} />;
  }

  const openTrades = entries.filter(e => e.status === 'Open').length;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      padding: 20,
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ 
          color: 'white', 
          fontSize: 28, 
          fontWeight: 700, 
          marginBottom: 8,
          marginTop: 40
        }}>
          Trade Decision Tool
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 40 }}>
          Score your trades. Stay disciplined.
        </p>

        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: 12, 
          padding: 16, 
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-around'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>{entries.length}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Total Trades</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#fbbf24' }}>{openTrades}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Open</div>
          </div>
        </div>

        <button
          onClick={() => setView('scorecard-a')}
          style={{
            width: '100%',
            padding: 20,
            marginBottom: 12,
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>Type A: Tipping Point</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>Catalyst-driven entry at inflection</div>
        </button>

        <button
          onClick={() => setView('scorecard-b')}
          style={{
            width: '100%',
            padding: 20,
            marginBottom: 12,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>Type B: Pullback</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>Re-entry on established trend</div>
        </button>

        <button
          onClick={() => setView('journal')}
          style={{
            width: '100%',
            padding: 20,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>Trade Journal</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>Review & manage your trades</div>
        </button>

        <div style={{ 
          marginTop: 32, 
          padding: 16, 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: 8,
          fontSize: 12,
          color: '#94a3b8'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#cbd5e1' }}>Score Thresholds</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <span>{'<60: No Trade'}</span>
            <span>60-69: 5-10%</span>
            <span>70-79: 10-20%</span>
            <span>80-89: 20-25%</span>
            <span>90+: 25-30%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
