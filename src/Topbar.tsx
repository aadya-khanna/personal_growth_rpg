import { useState, useRef, useEffect } from 'react';
import type { AppState } from './types';
import { xpToNextLevel } from './store';
import { getClassTitle } from './utils';

interface TopbarProps {
  state: AppState;
  onNameChange: (name: string) => void;
  onClearQuests: () => void;
  onToggleSettings: () => void;
  onShowLeaderboard: () => void;
  onLogout: () => void;
  onCustomize: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function Topbar({
  state,
  onNameChange,
  onClearQuests,
  onToggleSettings,
  onShowLeaderboard,
  onLogout,
  onCustomize,
  isDarkMode,
  onToggleTheme,
}: TopbarProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(state.characterName);
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { level, currentInLevel, needed } = xpToNextLevel(state.totalXp);
  const classTitle = getClassTitle(state.stats);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  useEffect(() => {
    if (editingName) inputRef.current?.focus();
  }, [editingName]);

  useEffect(() => {
    if (!showSettings) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowSettings(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showSettings]);

  const handleNameSubmit = () => {
    const v = nameInput.trim() || 'Hero';
    onNameChange(v);
    setNameInput(v);
    setEditingName(false);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {editingName ? (
          <input
            ref={inputRef}
            className="topbar-name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
          />
        ) : (
          <span
            className="topbar-name"
            onClick={() => setEditingName(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setEditingName(true)}
          >
            {state.characterName}
          </span>
        )}
        <span className="topbar-sep">·</span>
        <span className="topbar-class" title={classTitle}>{classTitle}</span>
        <span className="topbar-sep">·</span>
        <span className="topbar-xp-label">LVL {level}</span>
      </div>

      <div className="topbar-xp-wrap">
        <div className="topbar-xp-bar">
          <div
            className="topbar-xp-fill"
            style={{ width: `${(currentInLevel / needed) * 100}%` }}
          />
        </div>
        <span className="topbar-xp-text">
          LVL {level} ── LVL {level + 1}  ·  {currentInLevel.toLocaleString()} / {needed.toLocaleString()} XP
        </span>
      </div>

      <div className="topbar-right">
        <span className="topbar-streak">🔥 {state.streak.count}</span>
        <span className="topbar-date">{today}</span>
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-1.5 bg-[#f0a500] text-white rounded-md font-mono text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          onClick={onShowLeaderboard}
        >
          🏆 Leaderboard
        </button>
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            className="topbar-settings"
            onClick={() => { setShowSettings(!showSettings); onToggleSettings(); }}
            aria-label="Settings"
          >
            ⚙
          </button>
          {showSettings && (
            <div className="settings-dropdown">
              {state.characterConfig && (
                <button
                  type="button"
                  onClick={() => { onCustomize(); setShowSettings(false); }}
                >
                  ✎ Customize Character
                </button>
              )}
              <button
                type="button"
                onClick={() => { onToggleTheme(); setShowSettings(false); }}
              >
                {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
              <button
                type="button"
                onClick={() => { if (window.confirm('Remove all active and completed quests?')) { onClearQuests(); setShowSettings(false); } }}
                style={{ color: 'var(--muted)' }}
              >
                Clear quests
              </button>
              <button
                type="button"
                onClick={() => { onLogout(); setShowSettings(false); }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
