import { useState, useRef } from 'react';
import type { AppState, Daily } from './types';
import { QuestCard } from './QuestCard';
import { NewQuestModal } from './NewQuestModal';
import { NewDailyModal } from './NewDailyModal';

interface QuestLogProps {
  state: AppState;
  onAddQuest: (opts: {
    title: string;
    plainDescription: string;
    skill: import('./types').StatId;
    difficulty: import('./types').Difficulty;
    subTaskLabels: string[];
  }) => void;
  onSubtaskToggle: (questId: string, subTaskId: string) => void;
  onCompleteQuest: (questId: string) => void;
  onAddDaily: (opts: { title: string; plainDescription: string; skill: import('./types').StatId }) => void;
  onDailyToggle: (dailyId: string) => void;
  powerFocusMultiplier: number;
}

export function QuestLog({
  state,
  onAddQuest,
  onSubtaskToggle,
  onCompleteQuest,
  onAddDaily,
  onDailyToggle,
  powerFocusMultiplier,
}: QuestLogProps) {
  const [showNewQuest, setShowNewQuest] = useState(false);
  const [showNewDaily, setShowNewDaily] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const questListRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative flex-1 min-w-0 flex flex-col bg-bg p-4 overflow-hidden animate-[fadeUp_0.5s_ease-out_0.24s_both]">
      <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
        <span className="text-xp">✦</span> Active Quests
      </h2>
      <div className="flex-1 overflow-auto flex flex-col gap-3 pr-1" ref={questListRef}>
        {state.quests.map((q) => (
          <QuestCard
            key={q.id}
            quest={q}
            onSubtaskToggle={onSubtaskToggle}
            onCompleteQuest={onCompleteQuest}
            powerFocusMultiplier={powerFocusMultiplier}
          />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <h3 className="font-heading text-sm font-semibold mb-2.5 text-text">Daily Habits</h3>
        {state.dailies.map((d) => (
          <DailyRow
            key={d.id}
            daily={d}
            onToggle={() => onDailyToggle(d.id)}
          />
        ))}
        <button
          type="button"
          className="absolute bottom-4 right-4 py-2.5 px-[18px] font-sans text-sm font-medium bg-int text-white border-none rounded-lg cursor-pointer shadow-[0_2px_6px_rgba(124,96,216,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(124,96,216,0.4)]"
          style={{ marginTop: 8 }}
          onClick={() => setShowNewDaily(true)}
        >
          ＋ New Daily
        </button>
      </div>

      {state.completedQuests.length > 0 && (
        <div className="mt-3">
          <div
            className="font-heading text-[13px] font-semibold text-muted mb-2 cursor-pointer select-none"
            onClick={() => setCompletedOpen(!completedOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setCompletedOpen(!completedOpen)}
          >
            {completedOpen ? '▼' : '▶'} Completed Quests ({state.completedQuests.length})
          </div>
          {completedOpen && (
            <div className="flex flex-col gap-1.5">
              {state.completedQuests.slice(-10).reverse().map((q) => (
                <div
                  key={q.id}
                  className="bg-surface border border-border rounded-lg py-2 px-3 opacity-90"
                >
                  <div className="font-heading text-[13px] font-semibold text-text mb-0">{q.title}</div>
                  <div className="italic text-muted text-[11px]">{q.plainDescription}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className="absolute bottom-4 right-4 py-2.5 px-[18px] font-sans text-sm font-medium bg-xp text-white border-none rounded-lg cursor-pointer shadow-[0_2px_6px_rgba(240,165,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(240,165,0,0.4)]"
        onClick={() => setShowNewQuest(true)}
      >
        ＋ New Quest
      </button>

      {showNewQuest && (
        <NewQuestModal
          onClose={() => setShowNewQuest(false)}
          onSubmit={(opts) => { onAddQuest(opts); setShowNewQuest(false); }}
        />
      )}
      {showNewDaily && (
        <NewDailyModal
          onClose={() => setShowNewDaily(false)}
          onSubmit={(opts) => { onAddDaily(opts); setShowNewDaily(false); }}
        />
      )}
    </div>
  );
}

function DailyRow({ daily, onToggle }: { daily: Daily; onToggle: () => void }) {
  return (
    <div className={`flex items-center gap-2.5 py-2 px-3 bg-surface border border-border rounded-md mb-1.5 text-[13px] ${daily.completedToday ? 'opacity-85' : ''}`}>
      <div className="flex gap-1 shrink-0">
        {daily.streakDots.slice(0, 7).map((filled, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full ${filled ? 'bg-agi' : 'bg-border'}`} />
        ))}
      </div>
      <span className="flex-1 font-medium">{daily.title}</span>
      <div
        className={`w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 cursor-pointer ${
          daily.completedToday ? 'bg-agi border-agi text-white' : 'border-border hover:border-xp'
        }`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        aria-label={daily.title}
      >
        {daily.completedToday && <span className="text-xs">✓</span>}
      </div>
    </div>
  );
}
