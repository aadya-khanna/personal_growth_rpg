import { useState, useEffect, useCallback, useRef } from 'react';
import type { FormEvent } from 'react';
import type {
  AppState,
  Quest,
  Daily,
  StatId,
  Difficulty,
  SubTask,
  Achievement,
  CharacterConfig,
  Gender,
  SkinTone,
} from './types';
import {
  DIFFICULTY_XP,
  DIFFICULTY_STAT,
  SUBTASK_XP,
  SUBTASK_STAT,
  DAILY_XP,
  DAILY_STAT,
  DAILY_MP_REGEN,
  MISSED_DAILY_HP,
  POWER_FOCUS_MP_COST,
  POWER_FOCUS_MULTIPLIER,
  RECOVERY_TASKS_NEEDED,
} from './types';
import { loadState, saveState, exportState, importState, xpToNextLevel, resetProgress } from './store';
import { testGroqConnection, generateCharacterName } from './api';
import { supabase } from './supabaseClient';
import { Topbar } from './Topbar';
import { CharacterPanel } from './CharacterPanel';
import { QuestLog } from './QuestLog';
import { StatsPanel } from './StatsPanel';
import { buildSpriteLayers, getIdleFrameStyle, HAIR_COLORS, getWeaponForClass } from './characterSprites';

function todayStr(): string {
  return new Date().toDateString();
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toDateString();
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function applyAchievement(
  achievements: Achievement[],
  id: string,
  unlockedAt: number
): Achievement[] {
  return achievements.map((a) => (a.id === id && a.unlockedAt == null ? { ...a, unlockedAt } : a));
}

function rollDailiesForNewDay(s: AppState): AppState {
  const today = todayStr();
  let hpDelta = 0;
  const dailies = s.dailies.map((d) => {
    const lastRolled = d.lastRolledDate ?? today;
    if (lastRolled === today) return d;
    const dots = [...(d.streakDots ?? Array(7).fill(false))];
    const yesterdayWasDone = dots[0];
    if (lastRolled === yesterdayStr() && !yesterdayWasDone) hpDelta -= MISSED_DAILY_HP;
    return {
      ...d,
      streakDots: [false, ...dots.slice(0, 6)],
      completedToday: false,
      lastRolledDate: today,
    };
  });
  let hp = s.hp;
  if (hpDelta !== 0) {
    hp = Math.max(0, s.hp + hpDelta);
  }
  return {
    ...s,
    dailies,
    hp,
    fainted: hp === 0 ? true : s.fainted,
  };
}

function updateStreakOnComplete(s: AppState): AppState {
  const today = todayStr();
  const yesterday = yesterdayStr();
  const last = s.streak.lastDate;
  const count = last === yesterday ? s.streak.count + 1 : last === today ? s.streak.count : 1;
  return { ...s, streak: { count, lastDate: today } };
}

type AuthView = 'checking' | 'welcome' | 'signup' | 'login' | 'character' | 'app';

/** In dev, open with ?character or #character to jump straight to character creation. */
const isCharacterTestMode =
  typeof window !== 'undefined' &&
  (window.location.search.includes('character') || window.location.hash === '#character');

interface AuthUser {
  id: string;
  email: string;
  username?: string | null;
}

export default function App() {
  const [authView, setAuthView] = useState<AuthView>(isCharacterTestMode ? 'character' : 'checking');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [state, setState] = useState<AppState>(loadState);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const xpAtStartOfDayRef = useRef(state.totalXp);
  const lastDayRef = useRef(todayStr());
  const prevLevelRef = useRef(xpToNextLevel(state.totalXp).level);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isCharacterTestMode) {
        setAuthView('character');
        return;
      }
      try {
        const onboarded = localStorage.getItem('rpg_onboarded') === '1';
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (error) {
          // Supabase not reachable: fall back to local mode, but still respect onboarding flag
          setAuthView(onboarded ? 'app' : 'welcome');
          return;
        }
        const user = data.user;
        if (user) {
          setAuthUser({
            id: user.id,
            email: user.email ?? '',
            username: (user.user_metadata as { username?: string } | null)?.username ?? null,
          });
          setAuthView(onboarded ? 'app' : 'welcome');
        } else {
          setAuthView(onboarded ? 'app' : 'welcome');
        }
      } catch {
        const onboarded = localStorage.getItem('rpg_onboarded') === '1';
        setAuthView(onboarded ? 'app' : 'welcome');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const today = todayStr();
    if (lastDayRef.current !== today) {
      lastDayRef.current = today;
      xpAtStartOfDayRef.current = state.totalXp;
    }
  }, [state.totalXp]);

  useEffect(() => {
    const { level } = xpToNextLevel(state.totalXp);
    if (level > prevLevelRef.current) {
      setLevelUpVisible(true);
      const t = setTimeout(() => setLevelUpVisible(false), 2000);
      return () => clearTimeout(t);
    }
    prevLevelRef.current = level;
  }, [state.totalXp]);

  const handleSignup = useCallback(
    async (email: string, password: string, username: string) => {
      setAuthError(null);
      setAuthLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });
        if (error) throw error;
        const user = data.user;
        if (!user) throw new Error('Signup failed, no user returned');
        setAuthUser({
          id: user.id,
          email: user.email ?? '',
          username,
        });
        setAuthView('character');
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : String(e));
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      setAuthLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        const user = data.user;
        if (!user) throw new Error('Login failed, no user returned');
        setAuthUser({
          id: user.id,
          email: user.email ?? '',
          username: (user.user_metadata as { username?: string } | null)?.username ?? null,
        });
        // If no character configured yet, go to creation; otherwise straight into app
        setAuthView(state.characterConfig ? 'app' : 'character');
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : String(e));
      } finally {
        setAuthLoading(false);
      }
    },
    [state.characterConfig]
  );

  const handleLogout = useCallback(async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : String(e));
    } finally {
      setAuthUser(null);
      setAuthView('welcome');
      setAuthLoading(false);
    }
  }, []);

  const handleCharacterCreated = useCallback(
    (config: CharacterConfig) => {
      setState((s) => {
        const merged: AppState = {
          ...s,
          characterConfig: config,
          characterName: config.characterName,
        };
        if (authUser) {
          (async () => {
            try {
              await supabase.from('profiles').upsert({
                id: authUser.id,
                username: authUser.username ?? config.characterName,
                character_name: config.characterName,
                class_title: config.classTitle,
                gender: config.gender,
                skin_tone: config.skinTone,
                hair_style: config.hairStyle,
                hair_color: config.hairColor,
                clothing: config.clothing,
                weapon: config.weapon,
                level: merged.level,
                xp: merged.totalXp,
                hp: merged.hp,
                mp: merged.mp,
                str: merged.stats.STRENGTH,
                int: merged.stats.INTELLECT,
                agi: merged.stats.AGILITY,
                wis: merged.stats.WISDOM,
                streak: merged.streak.count,
              });
            } catch (e) {
              console.warn('Failed to save profile to Supabase', e);
            }
          })();
        }
        return merged;
      });
      // Mark that onboarding has happened so future launches can skip it
      try {
        localStorage.setItem('rpg_onboarded', '1');
      } catch {
        // ignore
      }
      setAuthView('app');
    },
    [authUser]
  );

  const addQuest = useCallback((opts: { title: string; plainDescription: string; skill: StatId; difficulty: Difficulty; subTaskLabels: string[] }) => {
    const xpReward = DIFFICULTY_XP[opts.difficulty];
    const statReward = DIFFICULTY_STAT[opts.difficulty];
    const subTasks: SubTask[] = opts.subTaskLabels.map((label) => ({
      id: generateId(),
      label,
      done: false,
    }));
    const quest: Quest = {
      id: generateId(),
      title: opts.title,
      plainDescription: opts.plainDescription,
      skill: opts.skill,
      difficulty: opts.difficulty,
      subTasks,
      completedAt: null,
      createdAt: Date.now(),
      xpReward,
      statReward,
    };
    setState((s) => rollDailiesForNewDay({ ...s, quests: [...s.quests, quest] }));
  }, []);

  const onSubtaskToggle = useCallback((questId: string, subTaskId: string) => {
    setState((s) => {
      let next = rollDailiesForNewDay(s);
      const quest = next.quests.find((q) => q.id === questId);
      if (!quest) return next;
      const sub = quest.subTasks.find((t) => t.id === subTaskId);
      if (!sub) return next;
      const wasDone = sub.done;
      const mult = next.powerFocusActive ? POWER_FOCUS_MULTIPLIER : 1;
      next = next.powerFocusActive ? { ...next, powerFocusActive: false } : next;

      const nextSubTasks = quest.subTasks.map((t) => (t.id === subTaskId ? { ...t, done: !t.done } : t));
      const doneCount = nextSubTasks.filter((x) => x.done).length;
      const allDone = nextSubTasks.length > 0 && doneCount === nextSubTasks.length;

      let totalXp = next.totalXp;
      let stats = { ...next.stats };
      let completedQuests = [...next.completedQuests];
      let quests = next.quests.map((q) => {
        if (q.id !== questId) return q;
        return { ...q, subTasks: nextSubTasks, completedAt: allDone ? Date.now() : null };
      });

      if (!wasDone) {
        totalXp += Math.round(SUBTASK_XP * mult);
        stats[quest.skill] = Math.min(100, stats[quest.skill] + Math.round(SUBTASK_STAT * mult));
        next = updateStreakOnComplete(next);
        if (next.fainted) {
          const recovery = next.recoveryTasksDone + 1;
          if (recovery >= RECOVERY_TASKS_NEEDED) {
            next = {
              ...next,
              fainted: false,
              recoveryTasksDone: 0,
              hp: Math.min(next.hpMax, Math.floor(next.hpMax / 2) + 20),
            };
          } else {
            next = { ...next, recoveryTasksDone: recovery };
          }
        }
      }

      if (allDone && !wasDone) {
        const completedQuest = { ...quest, subTasks: nextSubTasks, completedAt: Date.now() };
        completedQuests = [...completedQuests, completedQuest];
        quests = quests.filter((q) => q.id !== questId);
        totalXp += Math.round(quest.xpReward * mult);
        stats[quest.skill] = Math.min(100, stats[quest.skill] + Math.round(quest.statReward * mult));
        next = updateStreakOnComplete(next);
        let achievements = next.achievements;
        if (completedQuests.length === 1) achievements = applyAchievement(achievements, 'first_quest', Date.now());
        const { level } = xpToNextLevel(totalXp);
        if (level >= 5) achievements = applyAchievement(achievements, 'level_5', Date.now());
        const xpToday = totalXp - xpAtStartOfDayRef.current;
        if (xpToday >= 100) achievements = applyAchievement(achievements, 'xp_100_day', Date.now());
        if (stats.STRENGTH >= 50 && stats.INTELLECT >= 50 && stats.AGILITY >= 50 && stats.WISDOM >= 50) {
          achievements = applyAchievement(achievements, 'all_stats_50', Date.now());
        }
        next = { ...next, achievements };
      }

      return {
        ...next,
        quests,
        completedQuests,
        totalXp,
        stats,
      };
    });
  }, []);

  const addDaily = useCallback((opts: { title: string; plainDescription: string; skill: StatId }) => {
    const today = todayStr();
    const daily: Daily = {
      id: generateId(),
      title: opts.title,
      plainDescription: opts.plainDescription,
      skill: opts.skill,
      streakDots: [false, false, false, false, false, false, false],
      completedToday: false,
      createdAt: Date.now(),
      lastRolledDate: today,
    };
    setState((s) => rollDailiesForNewDay({ ...s, dailies: [...s.dailies, daily] }));
  }, []);

  const onDailyToggle = useCallback((dailyId: string) => {
    setState((s) => {
      let next = rollDailiesForNewDay(s);
      const daily = next.dailies.find((d) => d.id === dailyId);
      if (!daily) return next;
      const newDone = !daily.completedToday;
      const newDots = [...daily.streakDots];
      newDots[0] = newDone;
      next = {
        ...next,
        dailies: next.dailies.map((d) =>
          d.id === dailyId ? { ...d, completedToday: newDone, streakDots: newDots } : d
        ),
      };
      if (newDone) {
        next = { ...next, totalXp: next.totalXp + DAILY_XP, mp: Math.min(next.mpMax, next.mp + DAILY_MP_REGEN) };
        next.stats[daily.skill] = Math.min(100, next.stats[daily.skill] + DAILY_STAT);
        next = updateStreakOnComplete(next);
        if (next.streak.count >= 3) next = { ...next, achievements: applyAchievement(next.achievements, 'streak_3', Date.now()) };
        const { level } = xpToNextLevel(next.totalXp);
        if (level >= 5) next = { ...next, achievements: applyAchievement(next.achievements, 'level_5', Date.now()) };
        const xpToday = next.totalXp - xpAtStartOfDayRef.current;
        if (xpToday >= 100) next = { ...next, achievements: applyAchievement(next.achievements, 'xp_100_day', Date.now()) };
        if (next.stats.STRENGTH >= 50 && next.stats.INTELLECT >= 50 && next.stats.AGILITY >= 50 && next.stats.WISDOM >= 50) {
          next = { ...next, achievements: applyAchievement(next.achievements, 'all_stats_50', Date.now()) };
        }
      }
      return next;
    });
  }, []);

  const onPowerFocus = useCallback(() => {
    setState((s) => {
      if (s.mp < POWER_FOCUS_MP_COST || s.powerFocusActive) return s;
      return { ...s, mp: s.mp - POWER_FOCUS_MP_COST, powerFocusActive: true };
    });
  }, []);

  const onPowerFocusCancel = useCallback(() => {
    setState((s) => (s.powerFocusActive ? { ...s, powerFocusActive: false } : s));
  }, []);

  const onNameChange = useCallback((name: string) => {
    setState((s) => ({ ...s, characterName: name }));
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-growth-rpg-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const handleImport = useCallback((json: string) => {
    try {
      const patch = importState(json);
      setState((s) => ({ ...s, ...patch }));
    } catch {
      console.warn('Import failed');
    }
  }, []);

  const handleResetProgress = useCallback(() => {
    setState(resetProgress());
  }, []);

  const handleTestGroq = useCallback(() => testGroqConnection(), []);

  const handleClearQuests = useCallback(() => {
    setState((s) => ({ ...s, quests: [], completedQuests: [] }));
  }, []);

  const powerFocusMultiplier = state.powerFocusActive ? POWER_FOCUS_MULTIPLIER : 1;

  if (authView !== 'app') {
    return (
      <OnboardingShell
        view={authView}
        setView={setAuthView}
        loading={authLoading}
        error={authError}
        onSignup={handleSignup}
        onLogin={handleLogin}
        onCharacterCreated={handleCharacterCreated}
      />
    );
  }

  return (
    <div className="app">
      <Topbar
        state={state}
        onNameChange={onNameChange}
        onExport={handleExport}
        onImport={handleImport}
        onResetProgress={handleResetProgress}
        onTestGroq={handleTestGroq}
        onClearQuests={handleClearQuests}
        onToggleSettings={() => setState((s) => ({ ...s, settingsOpen: !s.settingsOpen }))}
        onShowLeaderboard={() => setLeaderboardOpen(true)}
        onLogout={handleLogout}
      />
      <main className="main">
        <CharacterPanel state={state} />
        <QuestLog
          state={state}
          onAddQuest={addQuest}
          onSubtaskToggle={onSubtaskToggle}
          onAddDaily={addDaily}
          onDailyToggle={onDailyToggle}
          powerFocusMultiplier={powerFocusMultiplier}
        />
        <StatsPanel state={state} onPowerFocus={onPowerFocus} onPowerFocusCancel={onPowerFocusCancel} />
      </main>
      {leaderboardOpen && (
        <LeaderboardPage
          currentUserId={authUser?.id ?? null}
          onClose={() => setLeaderboardOpen(false)}
        />
      )}
      {levelUpVisible && (
        <div className="level-up-overlay" aria-live="polite">
          <h2>⚔ LEVEL UP ⚔</h2>
        </div>
      )}
    </div>
  );
}

interface OnboardingShellProps {
  view: AuthView;
  setView: (view: AuthView) => void;
  loading: boolean;
  error: string | null;
  onSignup: (email: string, password: string, username: string) => void;
  onLogin: (email: string, password: string) => void;
  onCharacterCreated: (config: CharacterConfig) => void;
}

function OnboardingShell({
  view,
  setView,
  loading,
  error,
  onSignup,
  onLogin,
  onCharacterCreated,
}: OnboardingShellProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 py-8 bg-gradient-to-b from-amber-50/80 via-[#f7f5f0] to-[#e8e1d4]">
      <div className="w-full max-w-[880px] bg-white rounded-2xl border border-gray-200 shadow-xl p-7 sm:p-10 animate-[fadeUp_0.4s_ease-out]">
        {view === 'checking' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="font-heading font-bold text-2xl tracking-wide">Summoning your hero...</div>
            <div className="text-sm text-gray-500">Consulting the Supabase tomes.</div>
          </div>
        )}
        {view === 'welcome' && (
          <OnboardingWelcome
            onBeginSignup={() => setView('signup')}
            onBeginLogin={() => setView('login')}
          />
        )}
        {view === 'signup' && (
          <SignupForm
            loading={loading}
            error={error}
            onSubmit={onSignup}
            onBack={() => setView('welcome')}
          />
        )}
        {view === 'login' && (
          <LoginForm
            loading={loading}
            error={error}
            onSubmit={onLogin}
            onBack={() => setView('welcome')}
          />
        )}
        {view === 'character' && (
          <CharacterCreation
            loading={loading}
            onBack={() => setView('login')}
            onComplete={onCharacterCreated}
          />
        )}
      </div>
    </div>
  );
}
interface OnboardingWelcomeProps {
  onBeginSignup: () => void;
  onBeginLogin: () => void;
}

function OnboardingWelcome({ onBeginSignup, onBeginLogin }: OnboardingWelcomeProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="font-heading font-bold text-2xl tracking-wide">Personal Growth, As An RPG</div>
      <div className="text-sm text-gray-500 max-w-[480px]">
        Forge a character, track quests, and level up your real life.
      </div>
      <div className="flex justify-center gap-3 w-full mt-2">
        <button
          type="button"
          className="min-w-[180px] px-4 py-2.5 rounded-full bg-amber-500 text-white font-medium shadow hover:shadow-md hover:-translate-y-0.5 transition"
          onClick={onBeginSignup}
        >
          Begin the Journey
        </button>
        <button
          type="button"
          className="min-w-[180px] px-4 py-2.5 rounded-full bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200 transition"
          onClick={onBeginLogin}
        >
          I Already Have An Account
        </button>
      </div>
    </div>
  );
}

interface AuthFormBaseProps {
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

interface SignupFormProps extends AuthFormBaseProps {
  onSubmit: (email: string, password: string, username: string) => void;
}

function SignupForm({ loading, error, onBack, onSubmit }: SignupFormProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value.trim();
    if (!email || !password || !username) return;
    onSubmit(email, password, username);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="font-bold text-2xl tracking-wide">Sign Up</div>
      <div className="text-sm text-gray-500">Create your guild ledger entry.</div>
      <form className="flex flex-col gap-2.5 mt-1" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          <span>Username (for leaderboards)</span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            className="px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900"
          />
        </label>
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        <div className="flex justify-center gap-3 w-full mt-2">
          <button
            type="button"
            className="min-w-[180px] px-4 py-2.5 rounded-full bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200 transition"
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="submit"
            className="min-w-[180px] px-4 py-2.5 rounded-full bg-amber-500 text-white font-medium shadow hover:shadow-md disabled:opacity-70 transition"
            disabled={loading}
          >
            {loading ? 'Inscribing...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface LoginFormProps extends AuthFormBaseProps {
  onSubmit: (email: string, password: string) => void;
}

function LoginForm({ loading, error, onBack, onSubmit }: LoginFormProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    if (!email || !password) return;
    onSubmit(email, password);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="font-bold text-2xl tracking-wide">Log In</div>
      <div className="text-sm text-gray-500">Return to your ongoing saga.</div>
      <form className="flex flex-col gap-2.5 mt-1" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="px-2.5 py-2 rounded-lg border border-gray-200 text-sm text-gray-900"
          />
        </label>
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        <div className="flex justify-center gap-3 w-full mt-2">
          <button
            type="button"
            className="min-w-[180px] px-4 py-2.5 rounded-full bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200 transition"
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="submit"
            className="min-w-[180px] px-4 py-2.5 rounded-full bg-amber-500 text-white font-medium shadow hover:shadow-md disabled:opacity-70 transition"
            disabled={loading}
          >
            {loading ? 'Opening gates...' : 'Log In'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface CharacterCreationProps {
  loading: boolean;
  onBack: () => void;
  onComplete: (config: CharacterConfig) => void;
}

const CLOTHING_OPTIONS = ['basic', 'blue', 'green', 'purple', 'orange'];

const CLASS_TITLE_OPTIONS = [
  'Knight',
  'Farmer',
  'Archer',
  'Healer',
  'Monk',
];

function CharacterCreation({ loading, onBack, onComplete }: CharacterCreationProps) {
  const [gender, setGender] = useState<Gender>('male');
  const [skinTone, setSkinTone] = useState<SkinTone>('tone3');
  const [characterName, setCharacterName] = useState('');
  const [classTitle, setClassTitle] = useState('Knight');
  const [hairColor, setHairColor] = useState<string>(HAIR_COLORS[1]);
  const [clothing, setClothing] = useState<string>(CLOTHING_OPTIONS[0]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const spriteLayers = buildSpriteLayers({
    gender,
    characterName,
    classTitle,
    skinTone,
    hairStyle: hairColor,
    hairColor,
    clothing,
    weapon: getWeaponForClass(classTitle),
  });

  const handleRandomName = async () => {
    setAiError(null);
    setAiLoading(true);
    try {
      const name = await generateCharacterName();
      setCharacterName(name);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Could not reach Groq.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleComplete = () => {
    if (!characterName.trim() || !classTitle.trim()) return;
    const cfg: CharacterConfig = {
      gender,
      characterName: characterName.trim(),
      classTitle: classTitle.trim(),
      skinTone,
      hairStyle: hairColor,
      hairColor,
      clothing,
      weapon: getWeaponForClass(classTitle),
    };
    onComplete(cfg);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
      {/* Title — centered */}
      <header className="text-center pt-2 pb-6">
        <h1 className="font-heading font-bold text-3xl tracking-wide text-gray-900">
          Forge Your Avatar
        </h1>
      </header>

      {/* Main content: preview + form, centered as a block */}
      <div className="flex justify-center">
        <div className="flex gap-10 sm:gap-12 items-stretch">
          {/* Left: character preview */}
          <div className="w-[260px] shrink-0 flex flex-col">
            <div className="rounded-xl bg-linear-to-b from-amber-50/60 via-[#f7f5f0] to-[#e3dbc9] flex flex-col items-center justify-between flex-1 min-h-0 p-4">
              <div className="character-preview-sprite w-[290px] h-[240px] relative" ref={previewRef}>
                {spriteLayers.map((src, idx) => (
                  <div
                    key={idx}
                    className="character-preview-layer"
                    style={getIdleFrameStyle(src, 240)}
                  />
                ))}
              </div>
              <div className="text-center pt-3 w-full">
                <div className="font-heading font-semibold text-xl text-gray-900">{characterName || 'Your Name'}</div>
                <div className="text-base text-gray-500 mt-1">{classTitle || 'Wandering Adventurer'}</div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="flex flex-col gap-5 w-[320px] sm:w-[380px] min-w-0">
          {/* Look — Male / Female pill toggle */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-600">Look</span>
            <div className="inline-flex w-fit rounded-full p-2 gap-2 bg-gray-100 border border-gray-200 mt-0.5">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${gender === 'male' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                onClick={() => setGender('male')}
              >
                Male
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${gender === 'female' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                onClick={() => setGender('female')}
              >
                Female
              </button>
            </div>
          </div>

          {/* Name — text input + Random (Groq) on same row */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-600">Name</span>
            <div className="flex gap-2 items-center mt-0.5">
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 text-base text-gray-900"
              />
              <button
                type="button"
                className="shrink-0 py-2 px-3 text-sm border border-gray-200 rounded-full hover:bg-gray-100 transition disabled:opacity-70"
                onClick={handleRandomName}
                disabled={aiLoading}
              >
                {aiLoading ? 'Rolling...' : 'Random'}
              </button>
            </div>
            {aiError && <div className="text-red-500 text-sm mt-0.5">{aiError}</div>}
          </div>

          {/* Class Title — dropdown only */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-600">Class Title</span>
            <select
              value={classTitle}
              onChange={(e) => setClassTitle(e.target.value)}
              className="mt-0.5 w-full px-3 py-2 rounded-lg border border-gray-200 text-base text-gray-900"
            >
              {CLASS_TITLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              {!CLASS_TITLE_OPTIONS.includes(classTitle) && (
                <option value={classTitle}>{classTitle}</option>
              )}
            </select>
          </div>

          {/* Skin + Hair — two swatch pickers side by side */}
          <div className="flex gap-6">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-600">Skin</span>
              <div className="inline-flex w-fit rounded-full p-0.5 gap-0.5 bg-gray-100 border border-gray-200 mt-0.5">
                {(['tone1', 'tone2', 'tone3', 'tone4', 'tone5'] as SkinTone[]).map((tone, idx) => (
                  <button
                    key={tone}
                    type="button"
                    className={`p-0.5 rounded-full transition ${skinTone === tone ? 'bg-white shadow-sm ring-1 ring-gray-200' : ''}`}
                    onClick={() => setSkinTone(tone)}
                    title={`Skin tone ${idx + 1}`}
                  >
                    <span className={`color-swatch color-swatch--skin-${idx + 1}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-600">Hair</span>
              <div className="inline-flex w-fit rounded-full p-0.5 gap-0.5 bg-gray-100 border border-gray-200 mt-0.5">
                {HAIR_COLORS.map((c, idx) => (
                  <button
                    key={c}
                    type="button"
                    className={`p-0.5 rounded-full transition ${hairColor === c ? 'bg-white shadow-sm ring-1 ring-gray-200' : ''}`}
                    onClick={() => setHairColor(c)}
                    title={c.replace('-', ' ')}
                  >
                    <span className={`color-swatch color-swatch--hair-${idx + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clothing — dropdown full width of right column */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-600">Clothing</span>
            <select
              value={clothing}
              onChange={(e) => setClothing(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-base text-gray-900"
            >
              {CLOTHING_OPTIONS.map((c) => {
                const label =
                  c === 'basic'  ? 'Basic'  :
                  c === 'blue'   ? 'Blue'   :
                  c === 'green'  ? 'Green'  :
                  c === 'purple' ? 'Purple' :
                                  'Orange';
                return (
                  <option key={c} value={c}>
                    {label} Outfit
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        </div>
      </div>

      {/* Actions — centered */}
      <div className="flex justify-center gap-4 w-full mt-12 pt-6 pb-1">
        <button
          type="button"
          className="min-w-[160px] px-5 py-3 rounded-full bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200 transition text-base font-medium"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className="min-w-[160px] px-5 py-3 rounded-full bg-amber-500 text-white font-medium shadow hover:shadow-md disabled:opacity-70 transition text-base"
          disabled={loading}
          onClick={handleComplete}
        >
          {loading ? 'Sealing profile...' : 'Enter'}
        </button>
      </div>
    </div>
  );
}

interface LeaderboardPageProps {
  currentUserId: string | null;
  onClose: () => void;
}

interface LeaderboardProfile {
  id: string;
  username: string | null;
  character_name: string | null;
  class_title: string | null;
  level: number | null;
  xp: number | null;
  gender: Gender | null;
  skin_tone: SkinTone | null;
  hair_style: string | null;
  hair_color: string | null;
  clothing: string | null;
  weapon: string | null;
}

function LeaderboardPage({ currentUserId, onClose }: LeaderboardPageProps) {
  const [rows, setRows] = useState<LeaderboardProfile[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [friendCounts, setFriendCounts] = useState<Record<string, number>>({});
  const [friendMap, setFriendMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('id, username, character_name, class_title, level, xp, gender, skin_tone, hair_style, hair_color, clothing, weapon')
          .order('xp', { ascending: false })
          .limit(50);
        if (pErr) throw pErr;
        if (cancelled || !profiles) return;

        const typedProfiles = profiles as unknown as LeaderboardProfile[];
        setRows(typedProfiles);

        const { data: friends, error: fErr } = await supabase
          .from('friends')
          .select('user_id, friend_id');
        if (fErr) throw fErr;

        const counts: Record<string, number> = {};
        const map: Record<string, boolean> = {};
        if (friends) {
          for (const row of friends as Array<{ user_id: string; friend_id: string }>) {
            counts[row.user_id] = (counts[row.user_id] ?? 0) + 1;
            if (currentUserId && row.user_id === currentUserId) {
              map[row.friend_id] = true;
            }
          }
        }
        if (!cancelled) {
          setFriendCounts(counts);
          setFriendMap(map);
        }
      } catch (e) {
        if (!cancelled) {
          const msg =
            (e as any)?.message != null
              ? String((e as any).message)
              : e instanceof Error
              ? e.message
              : String(e);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const toggleFriend = async (targetId: string) => {
    if (!currentUserId || currentUserId === targetId) return;
    try {
      const { data: existing, error: selErr } = await supabase
        .from('friends')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('friend_id', targetId)
        .maybeSingle();
      if (selErr && selErr.code !== 'PGRST116') throw selErr;
      if (existing) {
        await supabase.from('friends').delete().eq('id', existing.id as string);
        setFriendMap((m) => ({ ...m, [targetId]: false }));
        setFriendCounts((c) => ({
          ...c,
          [currentUserId]: Math.max(0, (c[currentUserId] ?? 0) - 1),
        }));
      } else {
        await supabase.from('friends').insert({ user_id: currentUserId, friend_id: targetId });
        setFriendMap((m) => ({ ...m, [targetId]: true }));
        setFriendCounts((c) => ({
          ...c,
          [currentUserId]: (c[currentUserId] ?? 0) + 1,
        }));
      }
    } catch {
      // swallow for now, keep UI optimistic
    }
  };

  const buildConfigForRow = (row: LeaderboardProfile): CharacterConfig => {
    const classTitle = row.class_title ?? 'Adventurer';
    return {
      gender: row.gender ?? 'male',
      characterName: row.character_name ?? row.username ?? 'Hero',
      classTitle: classTitle,
      skinTone: row.skin_tone ?? 'tone3',
      hairStyle: row.hair_style ?? 'dark-brown',
      hairColor: row.hair_color ?? 'dark-brown',
      clothing: row.clothing ?? 'basic',
      weapon: getWeaponForClass(classTitle),
    };
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.45)] flex items-center justify-center z-40">
      <div className="w-full max-w-[900px] max-h-[80vh] bg-white rounded-2xl border border-gray-200 shadow-xl p-6 sm:p-8 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading font-bold text-2xl text-gray-900">Ledger of Legends</h2>
          <button
            type="button"
            className="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {loading && (
          <div className="text-sm text-gray-500">Summoning champions...</div>
        )}
        {error && (
          <div className="text-sm text-red-500">Could not load leaderboard: {error}</div>
        )}
        {!loading && !error && (
          <div className="mt-1 flex-1 overflow-y-auto pr-1 space-y-2">
            {rows.map((row, idx) => {
              const isMe = currentUserId === row.id;
              const isFriend = !!friendMap[row.id];
              const rank = idx + 1;
              const displayName = row.character_name || row.username || 'Wandering Hero';
              const level = row.level ?? 1;
              const xp = row.xp ?? 0;
              const friends = friendCounts[row.id] ?? 0;
              const expanded = expandedId === row.id;
              return (
                <div
                  key={row.id}
                  className={`rounded-xl border border-gray-200 bg-white/90 hover:bg-amber-50 transition cursor-pointer ${isMe ? 'ring-1 ring-amber-400' : ''}`}
                  onClick={() => setExpandedId(expanded ? null : row.id)}
                >
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 text-center font-heading font-semibold text-gray-700">#{rank}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold text-base text-gray-900 truncate">
                          {displayName}
                          {isMe && ' (You)'}
                        </span>
                        {row.class_title && (
                          <span className="text-xs text-gray-500 truncate">{row.class_title}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        LVL {level} · {xp.toLocaleString()} XP · {friends} friends
                      </div>
                    </div>
                    {!isMe && (
                      <button
                        type="button"
                        className={`ml-2 text-lg ${isFriend ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFriend(row.id);
                        }}
                        aria-label={isFriend ? 'Unfriend' : 'Add friend'}
                      >
                        {isFriend ? '🤝' : '➕'}
                      </button>
                    )}
                  </div>
                  {expanded && (
                    <div className="border-t border-gray-100 px-3 py-3 flex gap-4 items-center">
                      <div className="hidden sm:block">
                        <div className="w-[120px] h-[120px] rounded-xl bg-linear-to-b from-amber-50/60 via-[#f7f5f0] to-[#e3dbc9] flex items-center justify-center">
                          <div className="character-preview-sprite w-[120px] h-[120px] relative">
                            {buildSpriteLayers(buildConfigForRow(row)).map((src, i) => (
                              <div
                                key={i}
                                className="character-preview-layer"
                                style={getIdleFrameStyle(src, 120)}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-sm text-gray-700 space-y-1">
                        <div><span className="font-semibold">Name:</span> {displayName}</div>
                        <div><span className="font-semibold">Level:</span> {level}</div>
                        <div><span className="font-semibold">XP:</span> {xp.toLocaleString()}</div>
                        <div><span className="font-semibold">Friends:</span> {friends}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {rows.length === 0 && (
              <div className="text-sm text-gray-500">No heroes have entered the ledger yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
