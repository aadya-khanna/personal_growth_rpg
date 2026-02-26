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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>New Daily</h3>
        <label>Habit description</label>
        <input
          type="text"
          value={plain}
          onChange={(e) => setPlain(e.target.value)}
          placeholder="e.g. morning reading"
        />
        <label>Skill category</label>
        <select value={skill} onChange={(e) => setSkill(e.target.value as StatId)}>
          <option value="STRENGTH">STRENGTH</option>
          <option value="INTELLECT">INTELLECT</option>
          <option value="AGILITY">AGILITY</option>
          <option value="WISDOM">WISDOM</option>
        </select>
        {generating && (
          <p style={{ marginBottom: 12, color: 'var(--muted)' }}>
            <span className="sparkle">✦</span> Generating name…
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
            {generating ? 'Generating…' : 'Add Daily'}
          </button>
        </div>
      </div>
    </div>
  );
}
