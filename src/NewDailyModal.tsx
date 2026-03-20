import { useState } from 'react';
import type { StatId } from './types';
import { generateDailyName, hasApiKey } from './api';

interface NewDailyModalProps {
  onClose: () => void;
  onSubmit: (opts: { title: string; plainDescription: string; skill: StatId }) => void;
}

export function NewDailyModal({ onClose, onSubmit }: NewDailyModalProps) {
  const [plain, setPlain] = useState('');
  const [skill, setSkill] = useState<StatId>('WISDOM');
  const [generating, setGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const desc = plain.trim() || 'Daily habit';
    setGenerating(true);
    setApiError(null);
    let title = desc;
    try {
      title = await generateDailyName(desc);
    } catch (e) {
      setApiError('Could not reach API; using your description.');
      console.warn('Daily name API failed', e);
    } finally {
      setGenerating(false);
    }
    onSubmit({ title, plainDescription: desc, skill });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] animate-[fadeIn_0.2s_ease]" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-xl p-6 max-w-[420px] w-[90%] max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-heading text-lg mb-4">New Daily</h3>
        <label className="block text-xs text-muted mb-1">Habit description</label>
        <input
          type="text"
          value={plain}
          onChange={(e) => setPlain(e.target.value)}
          placeholder="e.g. morning reading"
          className="w-full py-2 px-2.5 border border-border rounded-md font-sans text-sm mb-3"
        />
        <label className="block text-xs text-muted mb-1">Skill category</label>
        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value as StatId)}
          className="w-full py-2 px-2.5 border border-border rounded-md font-sans text-sm mb-3"
        >
          <option value="STRENGTH">STRENGTH</option>
          <option value="INTELLECT">INTELLECT</option>
          <option value="AGILITY">AGILITY</option>
          <option value="WISDOM">WISDOM</option>
        </select>
        {generating && (
          <p className="mb-3 text-muted">
            <span className="inline-block animate-[sparkle_0.8s_ease_infinite] text-xp">✦</span> Generating name…
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
            {generating ? 'Generating…' : 'Add Daily'}
          </button>
        </div>
      </div>
    </div>
  );
}
