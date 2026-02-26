import type { AppState, Quest, Daily, Achievement, StatId } from './types';
import {
  ACHIEVEMENT_DEFS,
  LEVEL_FORMULA,
} from './types';

const STORAGE_KEY = 'personal-growth-rpg-v1';

const OLD_TO_NEW_STAT: Record<string, StatId> = {
  STR: 'STRENGTH',
  INT: 'INTELLECT',
  AGI: 'AGILITY',
  WIS: 'WISDOM',
};

function migrateStats(
  parsed: Record<string, number> | undefined,
  defaults: AppState['stats']
): AppState['stats'] {
  const result = { ...defaults };
  if (!parsed) return result;
  for (const [k, v] of Object.entries(parsed)) {
    const key = (OLD_TO_NEW_STAT[k] ?? k) as StatId;
    if (key in result) result[key] = v;
  }
  return result;
}

function migrateSkill(skill: string | undefined): StatId {
  if (!skill) return 'STRENGTH';
  return (OLD_TO_NEW_STAT[skill] ?? skill) as StatId;
}

function getDefaultState(): AppState {
  return {
    characterName: 'Hero',
    totalXp: 0,
    level: 1,
    hp: 100,
    hpMax: 100,
    mp: 80,
    mpMax: 80,
    streak: { count: 0, lastDate: '' },
    stats: { STRENGTH: 10, INTELLECT: 10, AGILITY: 10, WISDOM: 10 },
    quests: [],
    completedQuests: [],
    dailies: [],
    achievements: ACHIEVEMENT_DEFS.map((a) => ({ ...a })),
    powerFocusActive: false,
    fainted: false,
    recoveryTasksDone: 0,
    settingsOpen: false,
    characterConfig: null,
  };
}

function migrateFromLegacy(): Partial<AppState> | null {
  try {
    const progress = localStorage.getItem('progress');
    const checkboxes = localStorage.getItem('checkboxes');
    const xp = localStorage.getItem('xp');
    const streak = localStorage.getItem('streak');
    if (!xp && !progress && !checkboxes) return null;

    let totalXp = 0;
    if (xp) totalXp = Math.max(0, Number(JSON.parse(xp)) || 0);

    let level = 1;
    let acc = 0;
    while (acc + LEVEL_FORMULA(level) <= totalXp) {
      acc += LEVEL_FORMULA(level);
      level++;
    }

    let streakData = { count: 0, lastDate: '' };
    if (streak) {
      try {
        const s = JSON.parse(streak);
        streakData = { count: s?.count ?? 0, lastDate: s?.lastDate ?? '' };
      } catch {}
    }

    return {
      totalXp,
      level,
      streak: streakData,
      hp: 100,
      hpMax: 100,
      mp: 80,
      mpMax: 80,
    };
  } catch {
    return null;
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      const defaults = getDefaultState();
      const migrated = migrateFromLegacy();
      const merged: AppState = {
        ...defaults,
        ...migrated,
        ...parsed,
        stats: migrateStats(parsed.stats, defaults.stats),
        streak: parsed.streak ?? defaults.streak,
        achievements: Array.isArray(parsed.achievements)
          ? parsed.achievements
          : defaults.achievements,
        quests: Array.isArray(parsed.quests)
          ? (parsed.quests as Quest[]).map((q) => ({ ...q, skill: migrateSkill(q.skill) }))
          : defaults.quests,
        completedQuests: Array.isArray(parsed.completedQuests)
          ? (parsed.completedQuests as Quest[]).map((q) => ({ ...q, skill: migrateSkill(q.skill) }))
          : defaults.completedQuests,
        dailies: Array.isArray(parsed.dailies)
          ? (parsed.dailies as Daily[]).map((d) => ({
              ...d,
              skill: migrateSkill(d.skill),
              lastRolledDate: (d as Daily & { lastRolledDate?: string }).lastRolledDate ?? new Date().toDateString(),
            }))
          : defaults.dailies,
      };
      return merged;
    }
    // No saved state: only migrate from old app if legacy keys exist (one-time).
    // Do not re-migrate after user clears progress — that would bring back old XP.
    const migrated = migrateFromLegacy();
    if (migrated) {
      return { ...getDefaultState(), ...migrated };
    }
    return getDefaultState();
  } catch {
    return getDefaultState();
  }
}

const LEGACY_KEYS = ['progress', 'checkboxes', 'schedule', 'xp', 'streak'];

function clearLegacyKeys(): void {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    clearLegacyKeys();
  } catch (e) {
    console.warn('Failed to save state', e);
  }
}

export function resetProgress(): AppState {
  clearLegacyKeys();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return getDefaultState();
}

export function exportState(state: AppState): string {
  return JSON.stringify(
    {
      characterName: state.characterName,
      characterConfig: state.characterConfig,
      totalXp: state.totalXp,
      level: state.level,
      hp: state.hp,
      hpMax: state.hpMax,
      mp: state.mp,
      mpMax: state.mpMax,
      streak: state.streak,
      stats: state.stats,
      quests: state.quests,
      completedQuests: state.completedQuests,
      dailies: state.dailies,
      achievements: state.achievements,
      exportDate: new Date().toISOString(),
    },
    null,
    2
  );
}

export function importState(json: string): Partial<AppState> {
  const data = JSON.parse(json) as Record<string, unknown>;
  const result: Partial<AppState> = {};
  if (typeof data.characterName === 'string') result.characterName = data.characterName;
  if (data.characterConfig && typeof data.characterConfig === 'object') {
    result.characterConfig = data.characterConfig as AppState['characterConfig'];
  }
  if (typeof data.totalXp === 'number') result.totalXp = data.totalXp;
  if (typeof data.level === 'number') result.level = data.level;
  if (typeof data.hp === 'number') result.hp = data.hp;
  if (typeof data.hpMax === 'number') result.hpMax = data.hpMax;
  if (typeof data.mp === 'number') result.mp = data.mp;
  if (typeof data.mpMax === 'number') result.mpMax = data.mpMax;
  if (data.streak && typeof (data.streak as { count?: number }).count === 'number')
    result.streak = data.streak as AppState['streak'];
  if (data.stats && typeof data.stats === 'object') {
    result.stats = migrateStats(data.stats as Record<string, number>, getDefaultState().stats);
  }
  if (Array.isArray(data.quests)) {
    result.quests = (data.quests as Quest[]).map((q) => ({ ...q, skill: migrateSkill(q.skill) }));
  }
  if (Array.isArray(data.completedQuests)) {
    result.completedQuests = (data.completedQuests as Quest[]).map((q) => ({ ...q, skill: migrateSkill(q.skill) }));
  }
  if (Array.isArray(data.dailies)) {
    result.dailies = (data.dailies as Daily[]).map((d) => ({ ...d, skill: migrateSkill(d.skill) }));
  }
  if (Array.isArray(data.achievements)) result.achievements = data.achievements as Achievement[];
  return result;
}

export function xpForLevel(level: number): number {
  return LEVEL_FORMULA(level);
}

export function xpToNextLevel(totalXp: number): { level: number; currentInLevel: number; needed: number } {
  let level = 1;
  let acc = 0;
  while (acc + LEVEL_FORMULA(level) <= totalXp) {
    acc += LEVEL_FORMULA(level);
    level++;
  }
  const needed = LEVEL_FORMULA(level);
  const currentInLevel = totalXp - acc;
  return { level, currentInLevel, needed };
}
