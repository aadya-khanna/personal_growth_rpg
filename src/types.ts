export type StatId = 'STRENGTH' | 'INTELLECT' | 'AGILITY' | 'WISDOM';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type Gender = 'male' | 'female' | 'nonbinary';

export type SkinTone = 'tone1' | 'tone2' | 'tone3' | 'tone4' | 'tone5';

export interface CharacterConfig {
  gender: Gender;
  characterName: string;
  classTitle: string;
  skinTone: SkinTone;
  hairStyle: string;
  hairColor: string;
  clothing: string;
  weapon: string;
}

export interface SubTask {
  id: string;
  label: string;
  done: boolean;
}

export interface Quest {
  id: string;
  title: string; // AI-generated medieval name
  plainDescription: string; // user input
  skill: StatId;
  difficulty: Difficulty;
  subTasks: SubTask[];
  completedAt: number | null;
  createdAt: number;
  xpReward: number;
  statReward: number;
}

export interface Daily {
  id: string;
  title: string; // AI-generated
  plainDescription: string;
  skill: StatId;
  streakDots: boolean[]; // last 7 days, index 0 = today
  completedToday: boolean;
  createdAt: number;
  lastRolledDate: string; // YYYY-MM-DD or toDateString()
}

export interface Stats {
  STRENGTH: number;
  INTELLECT: number;
  AGILITY: number;
  WISDOM: number;
}

export interface Achievement {
  id: string;
  name: string;
  unlockedAt: number | null;
  icon: string; // emoji or short label
}

export interface AppState {
  characterName: string;
  totalXp: number;
  level: number;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  streak: { count: number; lastDate: string };
  stats: Stats;
  quests: Quest[];
  completedQuests: Quest[];
  dailies: Daily[];
  achievements: Achievement[];
  powerFocusActive: boolean;
  fainted: boolean;
  recoveryTasksDone: number;
  settingsOpen: boolean;
  characterConfig: CharacterConfig | null;
}

export const XP_PER_LEVEL_BASE = 100;
export const LEVEL_FORMULA = (level: number) =>
  Math.floor(XP_PER_LEVEL_BASE * Math.pow(level, 1.5));

export const DIFFICULTY_XP: Record<Difficulty, number> = {
  1: 50,
  2: 120,
  3: 250,
  4: 500,
  5: 500,
};

export const DIFFICULTY_STAT: Record<Difficulty, number> = {
  1: 2,
  2: 4,
  3: 8,
  4: 15,
  5: 15,
};

export const SUBTASK_XP = 15;
export const SUBTASK_STAT = 1;
export const DAILY_XP = 30;
export const DAILY_STAT = 2;
export const DAILY_MP_REGEN = 5;
export const MISSED_DAILY_HP = 10;
export const POWER_FOCUS_MP_COST = 20;
export const POWER_FOCUS_MULTIPLIER = 2;
export const RECOVERY_TASKS_NEEDED = 3;

export const STAT_COLORS: Record<StatId, string> = {
  STRENGTH: '#e07840',
  INTELLECT: '#7c60d8',
  AGILITY: '#3dc98a',
  WISDOM: '#c9a96e',
};

export const ACHIEVEMENT_DEFS: Achievement[] = [
  { id: 'first_quest', name: 'First Quest', unlockedAt: null, icon: '⚔' },
  { id: 'streak_3', name: '3-Day Streak', unlockedAt: null, icon: '🔥' },
  { id: 'level_5', name: 'Level 5', unlockedAt: null, icon: '⭐' },
  { id: 'xp_100_day', name: '100 XP in a Day', unlockedAt: null, icon: '✨' },
  { id: 'all_stats_50', name: 'All Stats Above 50', unlockedAt: null, icon: '🏆' },
];

export const CLASS_BY_STAT: Record<StatId, string[]> = {
  STRENGTH: ['The Forge Master', 'Keeper of the Anvil', 'Backend Warden'],
  INTELLECT: ['The Arcane Analyst', 'Scholar of the Codex', 'Keeper of Scrolls'],
  AGILITY: ['The Swift Artisan', 'Keeper of Momentum', 'Vanguard of Output'],
  WISDOM: ['Keeper of Markets', 'The Strategic Sage', 'Chronicler of Returns'],
};
