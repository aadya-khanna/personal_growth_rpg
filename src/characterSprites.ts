import type { CSSProperties } from 'react';
import type { CharacterConfig, ClothingConfig, Gender, SkinTone, TopOption } from './types';

const ASSETS_BASE = '/assets/GandalfHardcoreCharacter';
export const HAIR_COLORS = ['dark-brown', 'light-brown', 'red', 'blonde', 'black'];

const GANDALF_SHEET_WIDTH = 800;
const GANDALF_SHEET_HEIGHT = 448;

const FEMALE_BASE = `${ASSETS_BASE}/Female Clothing`;
const MALE_BASE = `${ASSETS_BASE}/Male Clothing`;

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

/** Default clothing for new characters. Female: basic corset + skirt. Male: basic shirt + basic pants. */
export function getDefaultClothing(gender: Gender): ClothingConfig {
  const g = gender === 'nonbinary' ? 'male' : gender;
  return {
    top: g === 'female' ? 'basic-corset' : 'basic-shirt',
    bottoms: g === 'female' ? 'skirt' : 'basic',
    boots: 'boots',
  };
}

const VALID_TOP_OPTIONS: TopOption[] = [
  'basic-corset', 'blue-corset', 'green-corset', 'purple-corset', 'orange-corset',
  'basic-shirt', 'blue-shirt', 'green-shirt', 'purple-shirt', 'orange-shirt',
];

/** Parse clothing from DB (JSON string or legacy "basic"/"blue" etc). */
export function parseClothingFromDb(raw: string | null, gender: Gender): ClothingConfig {
  if (!raw) return getDefaultClothing(gender);
  try {
    const parsed = JSON.parse(raw) as Partial<ClothingConfig>;
    if (parsed?.top && parsed?.bottoms && parsed?.boots) {
      const top = VALID_TOP_OPTIONS.includes(parsed.top as TopOption) ? parsed.top : getDefaultClothing(gender).top;
      return {
        top: top as TopOption,
        bottoms: parsed.bottoms,
        boots: parsed.boots,
      };
    }
  } catch {
    /* legacy string */
  }
  const g = gender === 'nonbinary' ? 'male' : gender;
  const legacy = raw as string;
  const legacyColors = ['basic', 'blue', 'green', 'purple', 'orange'];
  const color = legacyColors.includes(legacy) ? legacy : 'basic';
  const top: TopOption = g === 'female' ? `${color}-corset` as TopOption : `${color}-shirt` as TopOption;
  return {
    top,
    bottoms: g === 'female' ? 'skirt' : 'basic',
    boots: 'boots',
  };
}

/** Serialize clothing for DB storage. */
export function serializeClothingForDb(clothing: ClothingConfig): string {
  return JSON.stringify(clothing);
}

/** Returns ordered clothing layer filenames (bottom to top): top, bottoms, boots. */
function getClothingFilenames(gender: Gender, clothing: ClothingConfig): string[] {
  const g = gender === 'nonbinary' ? 'male' : gender;
  const layers: string[] = [];

  // Top: corsets from Female Clothing, shirts from Male Clothing (both available to all genders)
  const topMap: Record<TopOption, string> = {
    'basic-corset': `${FEMALE_BASE}/Corset.png`,
    'blue-corset': `${FEMALE_BASE}/Blue Corset v2.png`,
    'green-corset': `${FEMALE_BASE}/Green Corset v2.png`,
    'purple-corset': `${FEMALE_BASE}/Purple Corset v2.png`,
    'orange-corset': `${FEMALE_BASE}/Orange Corset v2.png`,
    'basic-shirt': `${MALE_BASE}/Shirt.png`,
    'blue-shirt': `${MALE_BASE}/Blue Shirt v2.png`,
    'green-shirt': `${MALE_BASE}/Green Shirt v2.png`,
    'purple-shirt': `${MALE_BASE}/Purple Shirt v2.png`,
    'orange-shirt': `${MALE_BASE}/orange Shirt v2.png`,
  };
  layers.push(topMap[clothing.top] ?? topMap['basic-corset']);

  const bootsPath = g === 'male' ? `${MALE_BASE}/Boots.png` : `${FEMALE_BASE}/Boots.png`;

  // Bottoms: skirt (female) or pants (all colors from male pack)
  if (clothing.bottoms === 'skirt') {
    // When skirt is selected, boots render below the skirt (skirt covers boots)
    layers.push(bootsPath);
    layers.push(`${FEMALE_BASE}/Skirt.png`);
  } else {
    const pantsMap: Record<string, string> = {
      basic: `${MALE_BASE}/Pants.png`,
      blue: `${MALE_BASE}/Blue Pants.png`,
      green: `${MALE_BASE}/Green Pants.png`,
      purple: `${MALE_BASE}/Purple Pants.png`,
      orange: `${MALE_BASE}/Orange Pants.png`,
    };
    layers.push(pantsMap[clothing.bottoms] ?? pantsMap.basic);
    layers.push(bootsPath);
  }

  return layers;
}

function getWeaponFilename(gender: Gender, weapon: string): string {
  const g = gender === 'nonbinary' ? 'male' : gender;
  const genderPrefix = g === 'male' ? 'Male' : 'Female';
  const weaponMap: Record<string, string> = {
    sword: 'Sword.png',
    stick: 'Stick.png',
    hoe: 'Hoe.png',
    basket: 'Basket.png',
    flower: 'Flower.png',
  };
  const weaponFile = weaponMap[weapon.toLowerCase()] ?? 'Sword.png';
  return `${ASSETS_BASE}/${genderPrefix} Hand/${genderPrefix} ${weaponFile}`;
}

/** Map class titles to weapon types. */
export function getWeaponForClass(classTitle: string): string {
  const classWeaponMap: Record<string, string> = {
    'Knight': 'sword',
    'Archer': 'stick',
    'Monk': 'flower',
    'Farmer': 'hoe',
    'Healer': 'basket',
  };
  return classWeaponMap[classTitle] ?? 'sword';
}

/** Build ordered sprite layer URLs for the given character config (Gandalf-hardcore assets). */
export function buildSpriteLayers(config: CharacterConfig): string[] {
  // Always derive weapon from class title to ensure consistency
  const weapon = getWeaponForClass(config.classTitle);
  const clothingLayers = getClothingFilenames(config.gender, config.clothing);
  return [
    getSkinFilename(config.gender, config.skinTone),
    getHairFilename(config.gender, config.hairColor),
    ...clothingLayers,
    getWeaponFilename(config.gender, weapon),
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
