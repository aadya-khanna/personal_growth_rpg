import { useState } from 'react';
import type { StatId, Difficulty } from './types';
import { generateQuestName, hasApiKey } from './api';

interface NewQuestModalProps {
  onClose: () => void;
  onSubmit: (opts: {
    title: string;
    plainDescription: string;
    skill: StatId;
    difficulty: Difficulty;
    subTaskLabels: string[];
  }) => void;
}

export function NewQuestModal({ onClose, onSubmit }: NewQuestModalProps) {
  const [plain, setPlain] = useState('');
  const [skill, setSkill] = useState<StatId>('INTELLECT');
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [subTasks, setSubTasks] = useState<string[]>(['']);
  const [generating, setGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const addSubtask = () => {
    if (subTasks.length < 5) setSubTasks([...subTasks, '']);
  };
  const removeSubtask = (i: number) => {
    setSubTasks(subTasks.filter((_, j) => j !== i));
  };
  const setSubtask = (i: number, v: string) => {
    const next = [...subTasks];
    next[i] = v;
    setSubTasks(next);
  };

  const handleSubmit = async () => {
    const desc = plain.trim() || 'Unnamed task';
    setGenerating(true);
    setApiError(null);
    let title = desc;
    try {
      title = await generateQuestName(desc, skill, difficulty);
    } catch (e) {
      setApiError('Could not reach API; using your description.');
      console.warn('Quest name API failed', e);
    } finally {
      setGenerating(false);
    }
    onSubmit({
      title,
      plainDescription: desc,
      skill,
      difficulty,
      subTaskLabels: subTasks.map((s) => s.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] animate-[fadeIn_0.2s_ease]" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-xl p-6 max-w-[420px] w-[90%] max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-heading text-lg mb-4">New Quest</h3>
        <label className="block text-xs text-muted mb-1">Task description</label>
        <input
          type="text"
          value={plain}
          onChange={(e) => setPlain(e.target.value)}
          placeholder="e.g. finish DCF model"
          className="w-full py-2 px-2.5 border border-border rounded-md font-sans text-sm mb-3"
        />
        <label className="block text-xs text-muted mb-1">Skill category</label>
        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value as StatId)}
          className="w-full py-2 px-2.5 border border-border rounded-md font-sans text-sm mb-3"
        >
          <option value="STRENGTH">STRENGTH — Building / Backend</option>
          <option value="INTELLECT">INTELLECT — Research / Reading</option>
          <option value="AGILITY">AGILITY — Output / Speed</option>
          <option value="WISDOM">WISDOM — Strategy / Investing</option>
        </select>
        <label className="block text-xs text-muted mb-1">Difficulty</label>
        <div className="flex gap-2 mb-3">
          {([1, 2, 3, 4, 5] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`py-1.5 px-2.5 border-2 rounded-md cursor-pointer font-mono ${
                difficulty === d
                  ? 'border-xp bg-xp/20'
                  : 'border-border bg-surface'
              }`}
            >
              {'★'.repeat(d)}
            </button>
          ))}
        </div>
        <label className="block text-xs text-muted mb-1">Sub-tasks (up to 5)</label>
        {subTasks.map((st, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              value={st}
              onChange={(e) => setSubtask(i, e.target.value)}
              placeholder={`Sub-task ${i + 1}`}
              className="flex-1 py-2 px-2.5 border border-border rounded-md font-sans text-sm"
            />
            <button
              type="button"
              className="py-2 px-3 bg-border border-none rounded-md cursor-pointer text-xs"
              onClick={() => removeSubtask(i)}
            >
              −
            </button>
          </div>
        ))}
        {subTasks.length < 5 && (
          <button
            type="button"
            className="mb-3 text-xs"
            onClick={addSubtask}
          >
            + Add sub-task
          </button>
        )}
        {generating && (
          <p className="mb-3 text-muted">
            <span className="inline-block animate-[sparkle_0.8s_ease_infinite] text-xp">✦</span> Generating quest name…
          </p>
        )}
        {apiError && (
          <p className="mb-3 text-hp text-xs">{apiError}</p>
        )}
        {!hasApiKey() && (
          <p className="mb-3 text-muted text-[11px]">
            Add VITE_GROQ_API_KEY to .env and restart dev server for AI names.
          </p>
        )}
        <div className="flex gap-2.5 mt-5">
          <button
            type="button"
            className="flex-1 py-2.5 px-4 rounded-lg font-sans text-sm font-medium cursor-pointer border-none bg-bg text-text border border-border"
            onClick={onClose}
            disabled={generating}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 py-2.5 px-4 rounded-lg font-sans text-sm font-medium cursor-pointer border-none bg-xp text-white"
            onClick={handleSubmit}
            disabled={!plain.trim() || generating}
          >
            {generating ? 'Generating…' : 'Create Quest'}
          </button>
        </div>
      </div>
    </div>
  );
}
