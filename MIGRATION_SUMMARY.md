# CSS → Tailwind Migration Summary

## What Was Migrated

All main game UI has been migrated from vanilla CSS classes to Tailwind utilities:

- **CharacterPanel** – avatar, HP/MP bars, name, class, equipment slots, class flavor
- **Topbar** – date, XP display, shop button, leaderboard, settings dropdown
- **QuestLog** – header, quest list, dailies section, completed section, add-quest buttons
- **QuestCard** – title, subtitle, skill badges, difficulty, XP, subtasks, progress bar, complete button
- **StatsPanel** – stat rows, power focus button, achievements grid
- **NewDailyModal** / **NewQuestModal** – backdrop, form layout, inputs, buttons
- **App** – layout (`app`, `main`), shop modal, level-up overlay
- **DailyRow** – streak dots, title, checkboxes

## Theme Configuration

`index.css` now uses:
- `@theme inline` for semantic colors (`bg`, `surface`, `border`, `text`, `muted`) that switch with `.dark`
- `@theme` for accent colors (`hp`, `mp`, `xp`, `str`, `int`, `agi`, `wis`) and fonts
- All keyframes (fadeUp, hpPulse, questComplete, checkboxBounce, fadeIn, sparkle, levelUpPop) in one place

## Left in Vanilla CSS (Intentionally)

These were kept in `App.css` to avoid breaking layout or functionality:

1. **Character customization / onboarding**
   - `char-customization-*`, `character-preview-*`, `color-swatch*` classes
   - Used in CharacterCreation flow with many conditional styles and theme-aware vars
   - Color swatches use fixed hex values; migration would require more careful handling
   - **Reason:** Complex flow; kept to avoid risk of breaking onboarding or character creation

## Flagged for Future Consideration

1. **Level-up overlay** – Uses fixed light parchment background `rgba(247,245,240,0.95)`. In dark mode it stays light. Original had the same behavior; consider theme-aware background later if desired.

## No Layout or Functionality Changes

- Layout, spacing, and behavior match the previous design
- Animations preserved (fadeUp, questComplete, checkboxBounce, etc.)
- Dynamic widths (progress bars) still use inline `style`
- Checkmark in checkbox/daily-check now rendered as a child `<span>✓</span>` instead of `::after` content (same visual result)
