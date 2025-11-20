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
