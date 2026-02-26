import type { StatId, Stats } from './types';
import { CLASS_BY_STAT } from './types';

function getClassTitle(s: Stats): string {
  const entries = (Object.entries(s) as [StatId, number][]).sort((a, b) => b[1] - a[1]);
  const [topId] = entries[0];
  const titles = CLASS_BY_STAT[topId];
  const idx = Math.min(Math.floor(s[topId] / 33), titles.length - 1);
  return titles[idx] ?? titles[0];
}

export function getClassFlavor(stat: StatId): string {
  const flavors: Record<StatId, string> = {
    STRENGTH: 'Building and backend fortify the realm.',
    INTELLECT: 'Research and reading sharpen the mind.',
    AGILITY: 'Speed and output win the day.',
    WISDOM: 'Strategy and investing compound gains.',
  };
  return flavors[stat];
}

export function getEquipmentTier(level: number): 0 | 1 | 2 | 3 {
  if (level >= 21) return 3;
  if (level >= 11) return 2;
  if (level >= 6) return 1;
  return 0;
}

export { getClassTitle };
