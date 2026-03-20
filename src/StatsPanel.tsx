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

const statBarColors: Record<StatId, string> = {
  STRENGTH: 'bg-str',
  INTELLECT: 'bg-int',
  AGILITY: 'bg-agi',
  WISDOM: 'bg-wis',
};

export function StatsPanel({ state, onPowerFocus, onPowerFocusCancel }: StatsPanelProps) {
  return (
    <aside className="w-[335px] shrink-0 bg-surface border-l border-border flex flex-col p-4 overflow-auto animate-[fadeUp_0.5s_ease-out_0.32s_both]">
      <h2 className="font-heading text-lg font-semibold mb-3.5">Character Stats</h2>
      {(['STRENGTH', 'INTELLECT', 'AGILITY', 'WISDOM'] as StatId[]).map((id) => (
        <div key={id} className="mb-3">
          <label className="flex items-center justify-between font-mono text-xs mb-1">
            <span className="font-medium" style={{ color: STAT_COLORS[id] }}>{id}</span>
            <span>{state.stats[id]}</span>
          </label>
          <div className="h-2 bg-border rounded overflow-hidden">
            <div
              className={`h-full rounded transition-[width] duration-300 ease-out ${statBarColors[id]}`}
              style={{ width: `${Math.min(100, (state.stats[id] / MAX_STAT) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted" title={STAT_LABELS[id]}>
            {STAT_LABELS[id]}
          </span>
        </div>
      ))}

      <button
        type="button"
        className={`mt-3 py-2 px-3 text-xs font-sans cursor-pointer rounded-md border-none ${
          state.powerFocusActive ? 'bg-xp text-white' : 'bg-mp text-white disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
        onClick={state.powerFocusActive ? onPowerFocusCancel : onPowerFocus}
        disabled={!state.powerFocusActive && state.mp < 20}
        title={state.powerFocusActive ? 'Cancel Power Focus' : '2x XP for next task (costs 20 MP)'}
      >
        {state.powerFocusActive ? 'Cancel Power Focus' : 'Power Focus (20 MP)'}
      </button>

      <h3 className="font-heading font-semibold text-text mt-5 mb-3.5 text-sm">Achievements</h3>
      <div className="grid grid-cols-4 gap-2 mt-4">
        {state.achievements.map((a) => (
          <div
            key={a.id}
            className={`aspect-square bg-bg border border-border rounded-lg flex flex-col items-center justify-center text-xl cursor-default transition-transform duration-200 hover:scale-105 ${
              a.unlockedAt != null ? 'text-xp' : 'opacity-50 text-muted text-sm'
            }`}
            title={a.unlockedAt != null ? `${a.name} — ${new Date(a.unlockedAt).toLocaleDateString()}` : '???'}
          >
            {a.unlockedAt != null ? a.icon : '?'}
            {a.unlockedAt != null && (
              <span className="text-[9px] font-sans mt-0.5 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {a.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
