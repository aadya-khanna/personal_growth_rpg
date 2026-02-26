# Personal Growth RPG

A Habitica-style personal growth tracker: your real life is an RPG. Tasks become quests with AI-generated medieval names, completing work levels up your character, and stats map to real skills.

## Stack

- **React 18** + **TypeScript**
- **Vite** for build and dev server
- **CSS** (single stylesheet, no Tailwind/MUI)
- **localStorage** for persistence (no backend)
- **Groq API (Llama 3)** for quest/daily name generation (optional, free tier)

## Setup

```bash
npm install
cp .env.example .env   # optional: add VITE_GROQ_API_KEY for AI names
npm run dev
```

Open http://localhost:5173. Build with `npm run build`; preview with `npm run preview`.

## Features

- **Topbar**: Character name (editable), class title from highest stat, global XP bar, streak, date, settings (export/import JSON).
- **Character panel**: Pixel-style avatar with equipment tiers by level, HP/MP bars, equipment slots, class flavor text.
- **Quest log**: Add quests (task + skill + difficulty + sub-tasks). AI generates a medieval quest name via Groq (Llama 3). Complete sub-tasks for XP; full completion moves the card to Completed and grants base XP.
- **Dailies**: Repeatable habits with 7-day streak dots. AI-generated ritual-style names. Complete for XP + MP; miss for -10 HP.
- **Stats & skills**: STR / INT / AGI / WIS bars (Building, Research, Output, Strategy). Power Focus (20 MP) for 2x XP on next task. Achievements grid (First Quest, 3-Day Streak, Level 5, 100 XP in a Day, All Stats 50).

## Gamification

- **XP & level**: Formula `100 × level^1.5` per level. Difficulty: ★ 50 XP, ★★ 120, ★★★ 250, ★★★★/★★★★★ 500. Sub-tasks +15 XP, dailies +30 XP.
- **HP**: Start 100. Miss a daily: -10. At 0, character faints (visual + stat penalty); complete 3 tasks to recover.
- **MP**: Complete daily +5 MP. Power Focus costs 20 MP for 2x next completion.
- **Streak**: Consecutive days with at least one completion; 7-day bonus and achievement.

## API key

Create `.env` with:

```env
VITE_GROQ_API_KEY=your_key_here
```

Get a free key at https://console.groq.com/keys. Without it, quest and daily names fall back to the raw task description. Model used: `llama-3.1-8b-instant`.

## Data

All state is stored in `localStorage` under `personal-growth-rpg-v1`. Use **Export JSON** and **Import JSON** from the settings (⚙) in the topbar to backup or migrate data. Legacy data from the previous single-file app (progress, checkboxes, schedule, xp, streak) is migrated on first load if present.
