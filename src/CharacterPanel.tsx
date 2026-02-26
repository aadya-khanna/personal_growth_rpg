import type { AppState } from './types';
import { getClassFlavor, getEquipmentTier } from './utils';
import type { StatId } from './types';
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
  const topStat = (['STRENGTH', 'INTELLECT', 'AGILITY', 'WISDOM'] as StatId[]).reduce((a, b) =>
    state.stats[b] > state.stats[a] ? b : a
  );
  const flavor = getClassFlavor(topStat);

  return (
    <div className={`panel-character ${state.fainted ? 'fainted' : ''}`}>
      {state.characterConfig ? (
        <div className="character-avatar character-avatar--user" aria-hidden>
          <div className="character-avatar__user-layers">
            {buildSpriteLayers(state.characterConfig).map((src, idx) => (
              <div
                key={idx}
                className="character-avatar__user-layer"
                style={getIdleFrameStyle(src, 160)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="character-avatar character-avatar--placeholder" aria-hidden>
          <span className="character-avatar__placeholder-text">?</span>
        </div>
      )}
      <div className="hp-bar">
        <div className="bar-wrap">
          <div
            className="bar-fill"
            style={{ width: `${Math.max(0, (state.hp / state.hpMax) * 100)}%` }}
          />
        </div>
        <span>{state.hp} / {state.hpMax} ❤️</span>
      </div>
      <div className="mp-bar">
        <div className="bar-wrap">
          <div
            className="bar-fill"
            style={{ width: `${Math.max(0, (state.mp / state.mpMax) * 100)}%` }}
          />
        </div>
        <span>{state.mp} / {state.mpMax} ✦</span>
      </div>
      <div className="equipment-slots">
        <span className="equipment-slots-label" title="Revealed by level: weapon, armor, helm, accessory">
          Equipment
        </span>
        {['weapon', 'armor', 'helm', 'accessory'].map((slot, i) => (
          <div
            key={slot}
            className="eq-slot"
            data-tooltip={EQUIPMENT_NAMES[i][tier]}
            title={EQUIPMENT_NAMES[i][tier]}
          >
            {tier === 0 ? '?' : ['⚔', '🛡', '⛑', '◆'][i]}
          </div>
        ))}
      </div>
      <p className="class-flavor">{flavor}</p>
    </div>
  );
}
