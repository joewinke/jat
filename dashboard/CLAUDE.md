# Beads Task Dashboard - Development Guide

## Project Overview

Multi-project task management dashboard powered by Beads + Agent Mail. Built with SvelteKit 5, Tailwind CSS v4, and DaisyUI.

## Tech Stack

- **Framework**: SvelteKit 5 (Svelte 5 runes: `$state`, `$derived`, `$props`)
- **Styling**: Tailwind CSS v4 + DaisyUI
- **Theme Management**: `theme-change` library + custom utilities
- **Build Tool**: Vite

## Theme Switching Implementation

### Critical: Tailwind v4 Syntax

**IMPORTANT**: This project uses Tailwind CSS v4, which requires completely different configuration syntax than v3.

#### ❌ Wrong (Tailwind v3 syntax - will NOT work):
```css
/* app.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### ✅ Correct (Tailwind v4 syntax):
```css
/* src/app.css */
@import "tailwindcss";

@plugin "daisyui" {
  themes:
    light,
    dark,
    cupcake,
    bumblebee,
    emerald,
    corporate,
    synthwave,
    retro,
    cyberpunk,
    valentine,
    halloween,
    garden,
    forest,
    aqua,
    lofi,
    pastel,
    fantasy,
    wireframe,
    black,
    luxury,
    dracula,
    cmyk,
    autumn,
    business,
    acid,
    lemonade,
    night,
    coffee,
    winter,
    dim,
    nord --default,
    sunset;
}
```

### Theme Switching Architecture

The theme system consists of three components:

**1. Layout Initialization** (`src/routes/+layout.svelte`):
```typescript
import { themeChange } from 'theme-change';

onMount(() => {
  themeChange(false);
});
```

**2. Theme Manager Utility** (`src/lib/utils/themeManager.ts`):
```typescript
export function setTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export function initializeTheme() {
  const localTheme = localStorage.getItem('theme');
  if (localTheme) {
    setTheme(localTheme);
  } else {
    setTheme('nord'); // default
  }
}
```

**3. Theme Selector Component** (`src/lib/components/ThemeSelector.svelte`):
```svelte
<script lang="ts">
  import { setTheme } from '$lib/utils/themeManager';

  let currentTheme = $state('nord');

  function handleThemeChange(themeName: string) {
    currentTheme = themeName;
    setTheme(themeName);
  }
</script>

<button onclick={() => handleThemeChange(theme.name)}>
  {theme.label}
</button>
```

### Troubleshooting Themes

**Symptoms**: Theme selector works (data-theme attribute changes) but colors don't change.

**Diagnosis**:
1. Check if `app.css` uses Tailwind v4 syntax (`@import "tailwindcss"`)
2. Verify `@plugin "daisyui"` block exists with theme list
3. Check browser DevTools → Elements → `<html data-theme="...">` changes
4. Inspect stylesheet count: `Array.from(document.styleSheets).length` (should be > 1)

**Solution**: Update `app.css` to Tailwind v4 syntax with proper `@plugin "daisyui"` configuration.

## DaisyUI Configuration

### Tailwind Config (`tailwind.config.js`)

This file exists but is **MOSTLY IGNORED** in Tailwind v4. Theme configuration must be in `app.css` using `@plugin` syntax.

```javascript
// This is here for compatibility but themes are loaded from app.css
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark', ...] // ⚠️ This is ignored in v4!
  }
};
```

### Proper Theme Loading (v4)

Themes MUST be declared in CSS using `@plugin` syntax (see app.css above).

## Key Files

```
dashboard/
├── src/
│   ├── app.css                          # Tailwind v4 config + DaisyUI themes
│   ├── routes/
│   │   └── +layout.svelte              # Initialize theme-change library
│   ├── lib/
│   │   ├── components/
│   │   │   └── ThemeSelector.svelte    # Theme picker dropdown
│   │   └── utils/
│   │       └── themeManager.ts         # Theme utilities
│   └── ...
├── tailwind.config.js                  # Legacy config (mostly ignored in v4)
└── package.json
```

## Common Pitfalls

### 1. Using Old Tailwind Syntax
**Problem**: Using `@tailwind` directives in Tailwind v4 prevents DaisyUI themes from loading.
**Solution**: Use `@import "tailwindcss"` and `@plugin "daisyui"` syntax.

### 2. Forgetting theme-change Library
**Problem**: Themes don't persist or don't switch properly.
**Solution**: Install `theme-change` and initialize in layout: `themeChange(false)`.

### 3. Missing Theme Declaration
**Problem**: Only black/white colors, no theme colors.
**Solution**: Ensure all themes are listed in `@plugin "daisyui"` block in `app.css`.

### 4. Cache Issues
**Problem**: Changes to `app.css` don't reflect in browser.
**Solution**:
```bash
rm -rf .svelte-kit node_modules/.vite
npm run dev
```
Then hard refresh browser (Ctrl+Shift+R).

## Svelte 5 Runes

This project uses Svelte 5 runes syntax:

```typescript
// State
let count = $state(0);

// Derived
const doubled = $derived(count * 2);

// Props
let { name, age = 18 } = $props();

// Effects
$effect(() => {
  console.log('count changed:', count);
});
```

## UI Patterns: Unified Queue/Drop Zone

### Overview

The **AgentCard** component (`src/lib/components/agents/AgentCard.svelte`) implements a unified Queue/Drop Zone pattern. This is a key UX pattern in the dashboard that future contributors should understand.

### The Pattern

**What:** Queue section and drop zone are merged into a single, multi-state UI component.

**Why:** Reduces visual redundancy, lowers cognitive load, and provides clearer user feedback.

**Where:** Lines 627-693 in `AgentCard.svelte` (with detailed comment block explaining rationale)

### Design Rationale

**Before (Separate Sections):**
```
┌─ Agent Card ──────────┐
│ Queue (3 tasks)       │
│ • Task 1              │
│ • Task 2              │
│ • Task 3              │
├───────────────────────┤
│ Drop Zone             │
│ [Drop tasks here]     │
└───────────────────────┘
```

**Problem:** Redundant sections, more visual noise, wastes space.

**After (Unified):**
```
┌─ Agent Card ──────────┐
│ Queue (3 tasks)       │
│ • Task 1              │
│ • Task 2              │
│ • Task 3              │
│                       │
│ [Entire section is    │
│  drop target with     │
│  visual feedback]     │
└───────────────────────┘
```

**Solution:** One section serves dual purpose - cleaner, more intuitive.

### Visual States (5 States)

| State | Border | Background | Feedback | Can Drop? |
|-------|--------|------------|----------|-----------|
| **Default** | Solid neutral | None | Shows queued tasks | Yes (on drag) |
| **Success** | Dashed green | `bg-success/10` | ✓ "Drop to assign" | Yes |
| **Dependency Block** | Dashed red | `bg-error/10` | ✗ Shows blocking task | No |
| **File Conflict** | Dashed red | `bg-error/10` | ⚠ Lists conflicts | No |
| **Assigning** | Solid neutral | Blur overlay | ⏳ Loading spinner | No |

**Critical:** All 5 states serve a purpose. Don't remove any without understanding impact.

### State Management

```svelte
let isDragOver = $state(false);           // Drag cursor over section?
let hasConflict = $state(false);          // File reservation conflicts?
let hasDependencyBlock = $state(false);   // Unmet task dependencies?
let isAssigning = $state(false);          // Assignment API call in progress?
let assignError = $state(null);           // Assignment error message
```

**State Transitions:**
```
Default → (drag enters) → Success/Block/Conflict
Success → (drop) → Assigning → Success/Error → Default
Block/Conflict → (drag leaves) → Default
```

### Drag-Drop Implementation

**Key Functions:**
- `handleDragOver(event)` - Detect conflicts/blocks, set visual state
- `handleDrop(event)` - Validate and execute assignment
- `handleDragLeave()` - Reset state when drag exits
- `detectConflicts(taskId)` - Check file reservation conflicts
- `analyzeDependencies(task)` - Check dependency blocks

**Drop Behavior:**
- **Entire queue section is droppable** (not just empty space)
- Conflicts/blocks prevent drop (`event.dataTransfer.dropEffect = 'none'`)
- New tasks appear at **top** of queue after successful assignment
- Visual feedback is immediate and reactive

### Error Handling Philosophy

**Inline Errors (Preferred):**
- Shows error message **inside** the drop zone
- User sees error in context of action
- Detailed messages explain **why** and **how to fix**

**Examples:**
- "Dependency Block! Complete task-xyz first"
- "File Conflict! src/\*\*/\*.ts conflicts with dashboard/\*\*"
- "Assignment timed out after 30 seconds"

**Not Used:**
- Toast notifications (lose context)
- Modal dialogs (interrupt flow)
- Generic errors ("Failed to assign task")

### For Contributors

**When modifying this pattern:**

1. **Test all 5 states** - Drag tasks with/without dependencies, conflicts
2. **Keep error messages specific** - Tell users exactly what's wrong
3. **Don't shrink drop target** - Entire section must remain droppable
4. **Preserve visual feedback** - Border/background changes are critical UX
5. **Check mobile** - Touch interactions should work (test on small screens)

**Common mistakes to avoid:**
- ❌ Making drop zone a small box inside queue
- ❌ Removing error states ("just show success/fail")
- ❌ Generic error messages ("Something went wrong")
- ❌ Modal dialogs for errors (breaks inline pattern)
- ❌ Changing border/background styles without purpose

**Files to review:**
- Component: `src/lib/components/agents/AgentCard.svelte` (lines 627-693)
- README: `dashboard/README.md` (search "Unified Queue/Drop Zone")
- Dependency utils: `src/lib/utils/dependencyUtils.ts`

### User Testing Insights

This pattern was validated through user feedback:

**Users preferred:**
- ✅ Single queue section (less clutter)
- ✅ Inline error messages (immediate context)
- ✅ Entire section as drop target (easier to use)
- ✅ Detailed error messages (actionable guidance)

**Users rejected:**
- ❌ Separate drop zone (felt redundant)
- ❌ Toast notifications (lose context)
- ❌ Small drop zones (hard to hit)
- ❌ Generic errors ("not helpful")

**Key Quote:** *"I like that I can see exactly why the task can't be assigned right where I'm trying to drop it."*

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Clean build cache
rm -rf .svelte-kit node_modules/.vite
```

## References

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [DaisyUI Themes](https://daisyui.com/docs/themes/)
- [theme-change Library](https://github.com/saadeghi/theme-change)
- [Svelte 5 Runes](https://svelte-5-preview.vercel.app/docs/runes)
- [SvelteKit Docs](https://kit.svelte.dev/docs)
