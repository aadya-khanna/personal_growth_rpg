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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>New Quest</h3>
        <label>Task description</label>
        <input
          type="text"
          value={plain}
          onChange={(e) => setPlain(e.target.value)}
          placeholder="e.g. finish DCF model"
        />
        <label>Skill category</label>
        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value as StatId)}
        >
          <option value="STRENGTH">STRENGTH — Building / Backend</option>
          <option value="INTELLECT">INTELLECT — Research / Reading</option>
          <option value="AGILITY">AGILITY — Output / Speed</option>
          <option value="WISDOM">WISDOM — Strategy / Investing</option>
        </select>
        <label>Difficulty</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {([1, 2, 3, 4, 5] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              style={{
                padding: '6px 10px',
                border: `2px solid ${difficulty === d ? 'var(--xp)' : 'var(--border)'}`,
                borderRadius: 6,
                background: difficulty === d ? 'rgba(240,165,0,0.2)' : 'var(--surface)',
                cursor: 'pointer',
                fontFamily: 'DM Mono',
              }}
            >
              {'★'.repeat(d)}
            </button>
          ))}
        </div>
        <label>Sub-tasks (up to 5)</label>
        {subTasks.map((st, i) => (
          <div key={i} className="subtask-row">
            <input
              value={st}
              onChange={(e) => setSubtask(i, e.target.value)}
              placeholder={`Sub-task ${i + 1}`}
            />
            <button type="button" onClick={() => removeSubtask(i)}>−</button>
          </div>
        ))}
        {subTasks.length < 5 && (
          <button type="button" onClick={addSubtask} style={{ marginBottom: 12, fontSize: 12 }}>
            + Add sub-task
          </button>
        )}
        {generating && (
          <p style={{ marginBottom: 12, color: 'var(--muted)' }}>
            <span className="sparkle">✦</span> Generating quest name…
          </p>
        )}
        {apiError && (
          <p style={{ marginBottom: 12, color: 'var(--hp)', fontSize: 12 }}>{apiError}</p>
        )}
        {!hasApiKey() && (
          <p style={{ marginBottom: 12, color: 'var(--muted)', fontSize: 11 }}>
            Add VITE_GROQ_API_KEY to .env and restart dev server for AI names.
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose} disabled={generating}>Cancel</button>
          <button type="button" className="primary" onClick={handleSubmit} disabled={!plain.trim() || generating}>
            {generating ? 'Generating…' : 'Create Quest'}
          </button>
        </div>
      </div>
    </div>
  );
}
