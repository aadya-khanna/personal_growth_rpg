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

  return (
    <div className={`quest-card ${isComplete ? 'completed' : ''}`}>
      <div className="quest-card-title">{quest.title}</div>
      <div className="quest-card-subtitle">{quest.plainDescription}</div>
      <div className="quest-card-meta">
        <span className={`quest-skill-badge ${quest.skill}`}>{quest.skill}</span>
        <span className="quest-difficulty">{'★'.repeat(quest.difficulty)}</span>
        <span className="quest-xp-badge">+{displayXp} XP</span>
      </div>
      <div className="quest-subtasks">
        {quest.subTasks.map((st) => (
          <div
            key={st.id}
            className={`quest-subtask ${st.done ? 'done' : ''}`}
          >
            <div
              className={`quest-checkbox ${st.done ? 'checked' : ''}`}
              onClick={() => onSubtaskToggle(quest.id, st.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSubtaskToggle(quest.id, st.id)}
              aria-label={st.label}
            />
            <span>[ ] {st.label}</span>
          </div>
        ))}
      </div>
      {total > 0 && (
        <div className="quest-progress-bar">
          <div
            className="quest-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {hasNoSubtasks && onCompleteQuest && (
        <button
          type="button"
          className="w-full mt-3 px-4 py-2 bg-[#3dc98a] hover:bg-[#35b57a] text-white rounded-lg font-mono text-sm transition-colors duration-200 flex items-center justify-center gap-2"
          onClick={() => onCompleteQuest(quest.id)}
        >
          ✓ Complete Quest
        </button>
      )}
    </div>
  );
}
