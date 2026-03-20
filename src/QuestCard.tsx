import type { Quest } from './types';
import { DIFFICULTY_XP, SUBTASK_XP } from './types';

interface QuestCardProps {
  quest: Quest;
  onSubtaskToggle: (questId: string, subTaskId: string) => void;
  onCompleteQuest?: (questId: string) => void;
  powerFocusMultiplier: number;
}

export function QuestCard({ quest, onSubtaskToggle, onCompleteQuest, powerFocusMultiplier }: QuestCardProps) {
  const doneCount = quest.subTasks.filter((s) => s.done).length;
  const total = quest.subTasks.length;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;
  const isComplete = total > 0 && doneCount === total;
  const baseXp = DIFFICULTY_XP[quest.difficulty];
  const subXp = doneCount * SUBTASK_XP;
  const totalXp = baseXp + subXp;
  const displayXp = Math.round(totalXp * powerFocusMultiplier);
  const hasNoSubtasks = total === 0;

  const skillBadgeBg: Record<string, string> = {
    STRENGTH: 'bg-str/20',
    INTELLECT: 'bg-int/20',
    AGILITY: 'bg-agi/20',
    WISDOM: 'bg-wis/20',
  };
  const skillBadgeText: Record<string, string> = {
    STRENGTH: 'text-str',
    INTELLECT: 'text-int',
    AGILITY: 'text-agi',
    WISDOM: 'text-wis',
  };

  return (
    <div
      className={`bg-surface border border-border rounded-lg py-3.5 px-4 transition-all duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${
        isComplete ? 'animate-[questComplete_0.8s_ease_forwards]' : ''
      }`}
    >
      <div className="font-heading text-[15px] font-semibold text-text mb-1">{quest.title}</div>
      <div className="italic text-muted text-xs mb-2">{quest.plainDescription}</div>
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span className={`text-[11px] font-medium py-0.5 px-2 rounded font-mono ${skillBadgeBg[quest.skill]} ${skillBadgeText[quest.skill]}`}>
          {quest.skill}
        </span>
        <span className="text-xp text-xs">{'★'.repeat(quest.difficulty)}</span>
        <span className="ml-auto font-mono text-xs text-xp font-medium">+{displayXp} XP</span>
      </div>
      <div className="mb-2.5">
        {quest.subTasks.map((st) => (
          <div
            key={st.id}
            className={`flex items-center gap-2 py-1 text-[13px] ${st.done ? 'text-muted line-through' : 'text-text'}`}
          >
            <div
              className={`w-[18px] h-[18px] border-2 rounded flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200 ${
                st.done
                  ? 'bg-agi border-agi text-white animate-[checkboxBounce_0.3s_ease]'
                  : 'border-border bg-surface hover:border-xp'
              }`}
              onClick={() => onSubtaskToggle(quest.id, st.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSubtaskToggle(quest.id, st.id)}
              aria-label={st.label}
            >
              {st.done && <span className="text-xs font-bold">✓</span>}
            </div>
            <span>[ ] {st.label}</span>
          </div>
        ))}
      </div>
      {total > 0 && (
        <div className="h-1 bg-border rounded overflow-hidden">
          <div
            className="h-full bg-xp rounded transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {hasNoSubtasks && onCompleteQuest && (
        <button
          type="button"
          className="w-full mt-3 px-4 py-2 bg-agi hover:bg-[#35b57a] text-white rounded-lg font-mono text-sm transition-colors duration-200 flex items-center justify-center gap-2"
          onClick={() => onCompleteQuest(quest.id)}
        >
          ✓ Complete Quest
        </button>
      )}
    </div>
  );
}
