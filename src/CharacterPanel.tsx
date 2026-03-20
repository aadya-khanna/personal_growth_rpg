import type { AppState } from './types';
import { getClassTitle, getEquipmentTier } from './utils';
import { xpToNextLevel } from './store';
import { buildSpriteLayers, getIdleFrameStyle } from './characterSprites';

interface CharacterPanelProps {
  state: AppState;
}

const EQUIPMENT_NAMES = [
  ['Rusty Blade', 'Apprentice Sword', 'Scholar\'s Staff', 'Arcane Blade'],
  ['Cloth Tunic', 'Leather Armor', 'Scholar Robes', 'Arcane Vestments'],
  ['Hood', 'Apprentice Helm', 'Scholar Cap', 'Arcane Crown'],
  ['Pendant', 'Amulet', 'Focus Crystal', 'Arcane Orb'],
];

export function CharacterPanel({ state }: CharacterPanelProps) {
  const tier = getEquipmentTier(state.level);
  const { level } = xpToNextLevel(state.totalXp);
  const classTitle = getClassTitle(state.stats);

  return (
    <div
      className={`w-[280px] shrink-0 bg-surface border-r border-border flex flex-col items-center p-4 animate-[fadeUp_0.5s_ease-out_0.16s_both] ${
        state.fainted ? 'border-l-4 border-l-hp animate-[hpPulse_0.6s_ease]' : ''
      }`}
    >
      {state.characterConfig ? (
        <div className="w-[200px] h-40 my-0 mx-auto mb-3 relative flex items-center justify-center overflow-hidden" aria-hidden>
          <div className="relative w-full h-full">
            {buildSpriteLayers(state.characterConfig).map((src, idx) => (
              <div
                key={idx}
                className="absolute left-0 top-0 w-full h-full bg-no-repeat bg-[position:0_0] pointer-events-none"
                style={getIdleFrameStyle(src, 160)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="w-[120px] h-40 my-0 mx-auto mb-3 bg-bg border border-dashed border-border rounded-lg flex items-center justify-center" aria-hidden>
          <span className="text-3xl text-muted font-semibold">?</span>
        </div>
      )}
      <div className="flex items-center gap-2 mb-2 font-mono text-xs w-full">
        <div className="flex-1 h-2 bg-border rounded overflow-hidden">
          <div
            className="h-full bg-hp rounded transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(0, (state.hp / state.hpMax) * 100)}%` }}
          />
        </div>
        <span>{state.hp} / {state.hpMax} ❤️</span>
      </div>
      <div className="flex items-center gap-2 mb-2 font-mono text-xs w-full">
        <div className="flex-1 h-2 bg-border rounded overflow-hidden">
          <div
            className="h-full bg-mp rounded transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(0, (state.mp / state.mpMax) * 100)}%` }}
          />
        </div>
        <span>{state.mp} / {state.mpMax} ✦</span>
      </div>
      
      <div className="w-full text-center mt-1 mb-2 pt-2 flex flex-col gap-0.5">
        <span className="font-heading font-semibold text-[15px] text-text">{state.characterName}</span>
        <span className="italic text-muted text-xs overflow-hidden text-ellipsis whitespace-nowrap" title={classTitle}>{classTitle}</span>
        <span className="font-mono text-[11px] text-muted">LVL {level}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mt-3 w-full">
        <span className="col-span-4 pt-10 text-[11px] text-muted text-center mb-0.5" title="Revealed by level: weapon, armor, helm, accessory">
          Equipment
        </span>
        {['weapon', 'armor', 'helm', 'accessory'].map((slot, i) => (
          <div
            key={slot}
            className={`aspect-square bg-bg border border-border rounded-md flex items-center justify-center cursor-default ${tier === 0 ? 'text-muted text-sm' : 'text-lg'}`}
            data-tooltip={EQUIPMENT_NAMES[i][tier]}
            title={EQUIPMENT_NAMES[i][tier]}
          >
            {tier === 0 ? '?' : ['⚔', '🛡', '⛑', '◆'][i]}
          </div>
        ))}
      </div>
      
    </div>
  );
}
