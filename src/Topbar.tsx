import { useState, useRef, useEffect } from 'react';
import type { AppState } from './types';
import { xpToNextLevel } from './store';
import { ClassIcon } from './ClassIcon';

interface TopbarProps {
  state: AppState;
  onClearQuests: () => void;
  onToggleSettings: () => void;
  onShowLeaderboard: () => void;
  onShowShop: () => void;
  onLogout: () => void;
  onCustomize: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function Topbar({
  state,
  onClearQuests,
  onToggleSettings,
  onShowLeaderboard,
  onShowShop,
  onLogout,
  onCustomize,
  isDarkMode,
  onToggleTheme,
}: TopbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { level, currentInLevel, needed } = xpToNextLevel(state.totalXp);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    if (!showSettings) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowSettings(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showSettings]);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <ClassIcon classTitle={state.characterConfig?.classTitle} className="topbar-class-icon" />
        <span className="topbar-date">{today}</span>
      </div>

      <div className="topbar-xp-wrap">
        <div className="topbar-xp-bar">
          <div
            className="topbar-xp-fill"
            style={{ width: `${(currentInLevel / needed) * 100}%` }}
          />
        </div>
        <span className="topbar-xp-text">
          LVL {level} · {currentInLevel.toLocaleString()} / {needed.toLocaleString()} XP
        </span>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="topbar-shop-btn"
          onClick={onShowShop}
          title="Shop"
        >
          <span className="topbar-shop-icon">🛒</span>
          <span className="topbar-shop-text">Shop</span>
        </button>
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
