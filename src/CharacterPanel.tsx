import { useState, useRef, useEffect } from 'react';
import type { AppState } from './types';
import { getClassFlavor, getClassTitle, getEquipmentTier } from './utils';
import { xpToNextLevel } from './store';
import type { StatId } from './types';
import { buildSpriteLayers, getIdleFrameStyle } from './characterSprites';

interface CharacterPanelProps {
  state: AppState;
  onNameChange?: (name: string) => void;
}

const EQUIPMENT_NAMES = [
  ['Rusty Blade', 'Apprentice Sword', 'Scholar\'s Staff', 'Arcane Blade'],
  ['Cloth Tunic', 'Leather Armor', 'Scholar Robes', 'Arcane Vestments'],
  ['Hood', 'Apprentice Helm', 'Scholar Cap', 'Arcane Crown'],
  ['Pendant', 'Amulet', 'Focus Crystal', 'Arcane Orb'],
];

export function CharacterPanel({ state, onNameChange }: CharacterPanelProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(state.characterName);
  const inputRef = useRef<HTMLInputElement>(null);
  const tier = getEquipmentTier(state.level);
  const { level } = xpToNextLevel(state.totalXp);
  const classTitle = getClassTitle(state.stats);
  const topStat = (['STRENGTH', 'INTELLECT', 'AGILITY', 'WISDOM'] as StatId[]).reduce((a, b) =>
    state.stats[b] > state.stats[a] ? b : a
  );
  const flavor = getClassFlavor(topStat);

  useEffect(() => {
    setNameInput(state.characterName);
  }, [state.characterName]);
  useEffect(() => {
    if (editingName) inputRef.current?.focus();
  }, [editingName]);

  const handleNameSubmit = () => {
    if (onNameChange) {
      const v = nameInput.trim() || 'Hero';
      onNameChange(v);
      setNameInput(v);
    }
    setEditingName(false);
  };

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
      <div className="panel-character-info">
        {onNameChange ? (
          editingName ? (
            <input
              ref={inputRef}
              className="panel-character-name-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            />
          ) : (
            <span
              className="panel-character-name"
              onClick={() => setEditingName(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(true)}
            >
              {state.characterName}
            </span>
          )
        ) : (
          <span className="panel-character-name">{state.characterName}</span>
        )}
        <span className="panel-character-class" title={classTitle}>{classTitle}</span>
        <span className="panel-character-level">LVL {level}</span>
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
