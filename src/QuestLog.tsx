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
    <div className="panel-quests">
      <h2 className="quest-log-header">
        <span className="icon">✦</span> Active Quests
      </h2>
      <div className="quest-list" ref={questListRef}>
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

      <div className="dailies-section">
        <h3 className="dailies-header">Daily Habits</h3>
        {state.dailies.map((d) => (
          <DailyRow
            key={d.id}
            daily={d}
            onToggle={() => onDailyToggle(d.id)}
          />
        ))}
        <button
          type="button"
          className="add-quest-btn"
          style={{ marginTop: 8, background: 'var(--int)' }}
          onClick={() => setShowNewDaily(true)}
        >
          ＋ New Daily
        </button>
      </div>

      {state.completedQuests.length > 0 && (
        <div className="completed-section">
          <div
            className="completed-header"
            onClick={() => setCompletedOpen(!completedOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setCompletedOpen(!completedOpen)}
          >
            {completedOpen ? '▼' : '▶'} Completed Quests ({state.completedQuests.length})
          </div>
          {completedOpen && (
            <div className="completed-list">
              {state.completedQuests.slice(-10).reverse().map((q) => (
                <div
                  key={q.id}
                  className="quest-card"
                  style={{ padding: '8px 12px', opacity: 0.9 }}
                >
                  <div className="quest-card-title" style={{ fontSize: 13 }}>{q.title}</div>
                  <div className="quest-card-subtitle" style={{ fontSize: 11 }}>{q.plainDescription}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className="add-quest-btn"
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
    <div className={`daily-row ${daily.completedToday ? 'done' : ''}`}>
      <div className="daily-streak-dots">
        {daily.streakDots.slice(0, 7).map((filled, i) => (
          <div key={i} className={`daily-dot ${filled ? 'filled' : ''}`} />
        ))}
      </div>
      <span className="daily-title">{daily.title}</span>
      <div
        className={`daily-check ${daily.completedToday ? 'done' : ''}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        aria-label={daily.title}
      />
    </div>
  );
}
