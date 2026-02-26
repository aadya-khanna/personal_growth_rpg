import type { CSSProperties } from 'react';
import type { CharacterConfig, Gender, SkinTone } from './types';

const ASSETS_BASE = '/assets/GandalfHardcoreCharacter';
export const HAIR_COLORS = ['dark-brown', 'light-brown', 'red', 'blonde', 'black'];

const GANDALF_SHEET_WIDTH = 800;
const GANDALF_SHEET_HEIGHT = 448;
const GANDALF_FRAME_W = 80;

function getSkinFilename(gender: Gender, skinTone: SkinTone): string {
  const g = gender === 'nonbinary' ? 'male' : gender;
  const toneToIndex: Record<SkinTone, number> = {
    tone1: 1,
    tone2: 2,
    tone3: 3,
    tone4: 4,
    tone5: 5,
  };
  const num = toneToIndex[skinTone] ?? 3;
  return `${ASSETS_BASE}/Character skin colors/${g === 'male' ? 'Male' : 'Female'} Skin${num}.png`;
}

function getHairFilename(gender: Gender, hairColor: string): string {
  const g = gender === 'nonbinary' ? 'male' : gender;
  const idx = Math.min(HAIR_COLORS.indexOf(hairColor) + 1, 5) || 1;
  return `${ASSETS_BASE}/${g === 'male' ? 'Male Hair' : 'Female Hair'}/${g === 'male' ? 'Male' : 'Female'} Hair${idx}.png`;
}

function getClothingFilename(gender: Gender, clothing: string): string {
  const g = gender === 'nonbinary' ? 'male' : gender;
  const map: Record<string, string> =
    g === 'male'
      ? {
          basic: 'Shirt.png',
          blue: 'Blue Shirt v2.png',
          green: 'Green Shirt v2.png',
          purple: 'Purple Shirt v2.png',
          orange: 'orange Shirt v2.png',
        }
      : {
          basic: 'Corset.png',
          blue: 'Blue Corset v2.png',
          green: 'Green Corset v2.png',
          purple: 'Purple Corset v2.png',
          orange: 'Orange Corset v2.png',
        };
  const file = map[clothing] ?? map.basic;
  return `${ASSETS_BASE}/${g === 'male' ? 'Male Clothing' : 'Female Clothing'}/${file}`;
}

function getWeaponFilename(gender: Gender): string {
  const g = gender === 'nonbinary' ? 'male' : gender;
  return `${ASSETS_BASE}/${g === 'male' ? 'Male Hand' : 'Female Hand'}/${g === 'male' ? 'Male' : 'Female'} Sword.png`;
}

/** Build ordered sprite layer URLs for the given character config (Gandalf-hardcore assets). */
export function buildSpriteLayers(config: CharacterConfig): string[] {
  return [
    getSkinFilename(config.gender, config.skinTone),
    getHairFilename(config.gender, config.hairColor),
    getClothingFilename(config.gender, config.clothing),
    getWeaponFilename(config.gender),
  ];
}

/** Idle frame style for a single layer. sizePx = height of the display (frame is 80×64). */
export function getIdleFrameStyle(backgroundImageUrl: string, sizePx: number): CSSProperties {
  const scale = sizePx / 64;
  const bgW = GANDALF_SHEET_WIDTH * scale;
  const bgH = GANDALF_SHEET_HEIGHT * scale;
  const encodedUrl = encodeURI(backgroundImageUrl);
  return {
    backgroundImage: `url("${encodedUrl}")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '0 0',
    backgroundSize: `${bgW}px ${bgH}px`,
  };
}
