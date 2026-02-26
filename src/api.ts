// Groq API (OpenAI-compatible) — Llama 3
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';
const MAX_TOKENS = 20;

function getApiKey(): string {
  return import.meta.env.VITE_GROQ_API_KEY ?? '';
}

export function hasApiKey(): boolean {
  return Boolean(getApiKey());
}

async function callGroq(prompt: string): Promise<string> {
  const API_KEY = getApiKey();
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: MAX_TOKENS,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || `HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (data.error?.message) throw new Error(data.error.message);
  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  return text;
}

function trimToThreeWords(s: string): string {
  return s.split(/\s+/).slice(0, 3).join(' ').trim() || s;
}

function trimToTwoWords(s: string): string {
  return s.split(/\s+/).slice(0, 2).join(' ').trim() || s;
}

export async function generateClassTitle(characterName: string): Promise<string> {
  const key = getApiKey();
  if (!key) return 'Wandering Adventurer';

  const prompt = `Generate a short, flavorful fantasy RPG class title in 2 words for a character named '${characterName}'. Examples: 'Arcane Analyst', 'Market Sage', 'Codewright Knight'. Return only the title, exactly 2 words, no punctuation.`;

  try {
    const text = await callGroq(prompt);
    return trimToTwoWords(text) || 'Wandering Adventurer';
  } catch (e) {
    console.warn('Groq class title failed', e);
    return 'Wandering Adventurer';
  }
}

/** Random fantasy character name via Groq. */
export async function generateCharacterName(): Promise<string> {
  const key = getApiKey();
  if (!key) return 'Hero of Ledger';

  const prompt = `Generate a short fantasy RPG character name, 1, 2, or 3 words. Examples: 'Aldric the Bold', 'Jormundan', 'Orion', 'Thorn Oakenshield'. Return only the name, no punctuation.`;

  try {
    const text = await callGroq(prompt);
    return trimToThreeWords(text) || 'Jorge the Brave';
  } catch (e) {
    console.warn('Groq character name failed', e);
    return 'Jorge the Brave';
  }
}

/** For settings "Test Groq": calls API with a simple prompt. */
export async function testGroqConnection(): Promise<string> {
  const key = getApiKey();
  if (!key) return 'Missing: add VITE_GROQ_API_KEY to .env and restart dev server';
  try {
    const text = await callGroq('Reply with exactly: OK');
    return text ? `Groq (Llama 3) says: ${text}` : 'Groq returned empty';
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

export async function generateQuestName(
  task: string,
  skill: string,
  _difficulty: number
): Promise<string> {
  const key = getApiKey();
  if (!key) return task;

  const prompt = `Generate a dramatic medieval/mystical quest name in 3 words or less for this task: '${task}'. Category: ${skill}. Make it epic and fantasy-flavoured. Examples: 'Reckoning of Returns', 'Siege Upon Backend', 'Arcane Model Codex'. Return only the name, 3 words or fewer. No punctuation.`;

  try {
    const text = await callGroq(prompt);
    return trimToThreeWords(text) || task;
  } catch (e) {
    console.warn('Groq API failed', e);
    throw e;
  }
}

export async function generateDailyName(habit: string): Promise<string> {
  const key = getApiKey();
  if (!key) return habit;

  const prompt = `Generate a short medieval quest name in 3 words or less for this daily habit: '${habit}'. Sound like a ritual or oath. Examples: 'Scholar Morning Rite', 'Vigil of Codewright'. Return only the name, 3 words or fewer. No punctuation.`;

  try {
    const text = await callGroq(prompt);
    return trimToThreeWords(text) || habit;
  } catch (e) {
    console.warn('Groq API failed', e);
    throw e;
  }
}
