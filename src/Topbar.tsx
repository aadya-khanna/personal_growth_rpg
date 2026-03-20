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
    <header className="shrink-0 flex items-center justify-between py-2.5 px-4 bg-surface border-b border-border font-mono text-[13px] animate-[fadeUp_0.4s_ease-out]">
      <div className="flex items-center gap-2.5">
        <ClassIcon classTitle={state.characterConfig?.classTitle} className="w-5 h-5 shrink-0 text-text" />
        <span className="text-text font-extralight whitespace-nowrap">{today}</span>
      </div>

      <div className="flex-1 max-w-[400px] mx-5 flex items-center justify-center gap-2.5">
        <span className="text-text whitespace-nowrap">
          LVL {level} · {currentInLevel.toLocaleString()} / {needed.toLocaleString()} XP
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-border rounded-md cursor-pointer text-text font-mono text-[13px] transition-colors duration-200 hover:bg-bg hover:border-text"
          onClick={onShowShop}
          title="Shop"
        >
          <span className="text-base leading-none">🛒</span>
          <span className="whitespace-nowrap">Shop</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-1.5 bg-xp text-white rounded-md font-mono text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          onClick={onShowLeaderboard}
        >
          🏆 Leaderboard
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="bg-transparent border-none cursor-pointer p-1 text-muted text-lg leading-none hover:text-text"
            onClick={() => { setShowSettings(!showSettings); onToggleSettings(); }}
            aria-label="Settings"
          >
            ⚙
          </button>
          {showSettings && (
            <div className="absolute top-full right-0 mt-1 bg-surface border border-border rounded-lg p-2 min-w-[160px] shadow-lg z-50">
              {state.characterConfig && (
                <button
                  type="button"
                  className="block w-full py-2 px-3 text-left bg-transparent border-none rounded cursor-pointer font-sans text-[13px] text-text hover:bg-bg"
                  onClick={() => { onCustomize(); setShowSettings(false); }}
                >
                  ✎ Customize Character
                </button>
              )}
              <button
                type="button"
                className="block w-full py-2 px-3 text-left bg-transparent border-none rounded cursor-pointer font-sans text-[13px] text-text hover:bg-bg"
                onClick={() => { onToggleTheme(); setShowSettings(false); }}
              >
                {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
              <button
                type="button"
                className="block w-full py-2 px-3 text-left bg-transparent border-none rounded cursor-pointer font-sans text-[13px] text-muted hover:bg-bg"
                onClick={() => { if (window.confirm('Remove all active and completed quests?')) { onClearQuests(); setShowSettings(false); } }}
              >
                Clear quests
              </button>
              <button
                type="button"
                className="block w-full py-2 px-3 text-left bg-transparent border-none rounded cursor-pointer font-sans text-[13px] text-text hover:bg-bg"
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
