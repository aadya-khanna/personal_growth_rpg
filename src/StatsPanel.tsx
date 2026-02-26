import type { AppState, StatId } from './types';
import { STAT_COLORS } from './types';

interface StatsPanelProps {
  state: AppState;
  onPowerFocus: () => void;
  onPowerFocusCancel: () => void;
}

const STAT_LABELS: Record<StatId, string> = {
  STRENGTH: 'Building / Backend',
  INTELLECT: 'Research / Reading',
  AGILITY: 'Output / Speed',
  WISDOM: 'Strategy / Investing',
};

const MAX_STAT = 100;

export function StatsPanel({ state, onPowerFocus, onPowerFocusCancel }: StatsPanelProps) {
  return (
    <aside className="panel-stats">
      <h2 className="stats-header">Character Stats</h2>
      {(['STRENGTH', 'INTELLECT', 'AGILITY', 'WISDOM'] as StatId[]).map((id) => (
        <div key={id} className={`stat-row ${id}`}>
          <label>
            <span style={{ color: STAT_COLORS[id] }}>{id}</span>
            <span>{state.stats[id]}</span>
          </label>
          <div className="stat-bar-wrap">
            <div
              className="stat-bar-fill"
              style={{ width: `${Math.min(100, (state.stats[id] / MAX_STAT) * 100)}%` }}
            />
          </div>
          <span style={{ fontSize: 10, color: 'var(--muted)' }} title={STAT_LABELS[id]}>
            {STAT_LABELS[id]}
          </span>
        </div>
      ))}

      <button
        type="button"
        className={`power-focus-btn ${state.powerFocusActive ? 'active' : ''}`}
        onClick={state.powerFocusActive ? onPowerFocusCancel : onPowerFocus}
        disabled={!state.powerFocusActive && state.mp < 20}
        title={state.powerFocusActive ? 'Cancel Power Focus' : '2x XP for next task (costs 20 MP)'}
      >
        {state.powerFocusActive ? 'Cancel Power Focus' : 'Power Focus (20 MP)'}
      </button>

      <h3 className="stats-header" style={{ marginTop: 20, fontSize: 14 }}>Achievements</h3>
      <div className="achievements-grid">
        {state.achievements.map((a) => (
          <div
            key={a.id}
            className={`achievement-badge ${a.unlockedAt != null ? 'unlocked' : 'locked'}`}
            title={a.unlockedAt != null ? `${a.name} — ${new Date(a.unlockedAt).toLocaleDateString()}` : '???'}
          >
            {a.unlockedAt != null ? a.icon : '?'}
            {a.unlockedAt != null && <span className="name">{a.name}</span>}
          </div>
        ))}
      </div>
    </aside>
  );
}
