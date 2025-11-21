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

## Nav Component Architecture

### Overview

The **Nav component** (`src/lib/components/Nav.svelte`) provides a reusable navigation bar for all dashboard pages. It uses a lightweight configuration approach to avoid massive prop drilling and keeps pages clean.

**Key Features:**
- Context-based configuration (not hardcoded per page)
- Responsive layout (no wrapping issues)
- Conditional elements (view toggles, project filters)
- Consistent theming with DaisyUI
- Single-row guarantee (flex-nowrap design)

### Architecture Pattern

**Configuration-driven approach:**

```
Page Component → Nav Component → navConfig.ts
     ↓               ↓
  Props         Context lookup
```

**Why this pattern:**
- ✅ Pages stay clean (minimal props)
- ✅ Easy to add new pages (just add config)
- ✅ Consistent UI across pages
- ✅ Single source of truth for nav structure
- ❌ NOT 874 lines of hardcoded HTML per page

### How to Use

#### Basic Usage (Simple Page)

```svelte
<script>
  import Nav from '$lib/components/Nav.svelte';
</script>

<!-- Minimal props - context drives the config -->
<Nav context="home" />
```

#### With View Toggle (Home Page)

```svelte
<script>
  import Nav from '$lib/components/Nav.svelte';

  let viewMode = $state('list');
</script>

<Nav
  context="home"
  {viewMode}
  onViewModeChange={(mode) => (viewMode = mode)}
/>
```

#### With Project Filter (Agents Page)

```svelte
<script>
  import Nav from '$lib/components/Nav.svelte';

  let selectedProject = $state('All Projects');
  let projects = $state(['jat', 'chimaro', 'jomarchy']);
  let taskCounts = $state(new Map([['jat', 15], ['chimaro', 8]]));

  function handleProjectChange(project: string) {
    selectedProject = project;
    // ... filter logic
  }
</script>

<Nav
  context="agents"
  {projects}
  {selectedProject}
  {onProjectChange}
  {taskCounts}
  showProjectFilter={true}
/>
```

### Configuration Structure

**File: `src/lib/config/navConfig.ts`**

```typescript
export interface NavConfig {
  title: string;              // Page title (e.g., "Agents")
  subtitle: string;           // Description text
  viewToggle?: ViewToggleOption[];  // Optional view mode buttons
  showProjectFilter?: boolean;      // Show project dropdown
  showThemeSelector?: boolean;      // Show theme picker (usually true)
}

export interface ViewToggleOption {
  value: string;    // Mode identifier (e.g., 'list')
  label: string;    // Display text (e.g., 'List View')
  link?: string;    // Optional navigation (for cross-page toggles)
}
```

### Adding a New Page

**Step 1: Create config in `navConfig.ts`**

```typescript
// My New Page
export const myPageConfig: NavConfig = {
  title: 'My New Feature',
  subtitle: 'Description of what this page does',
  viewToggle: undefined,  // or add view modes if needed
  showProjectFilter: false,  // true if needs project filtering
  showThemeSelector: true
};
```

**Step 2: Update Nav component to use the config**

Currently, Nav uses inline config (lines 48-74 in `Nav.svelte`). **TODO:** Refactor to import from `navConfig.ts` instead.

**Current pattern (inline):**
```typescript
const contextConfig = {
  home: { title: '...', subtitle: '...', ... },
  agents: { title: '...', subtitle: '...', ... }
};
```

**Better pattern (import from navConfig.ts):**
```typescript
import { homeConfig, agentsConfig, myPageConfig } from '$lib/config/navConfig';

const contextConfig = {
  home: homeConfig,
  agents: agentsConfig,
  'my-page': myPageConfig
};
```

**Step 3: Use Nav in your page**

```svelte
<!-- src/routes/my-page/+page.svelte -->
<script>
  import Nav from '$lib/components/Nav.svelte';
</script>

<div class="min-h-screen bg-base-200">
  <Nav context="my-page" />

  <!-- Your page content -->
</div>
```

### Props Reference

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `context` | `'home' \| 'agents' \| 'api-demo'` | - | ✅ Yes | Determines which nav config to use |
| `projects` | `string[]` | `[]` | ❌ No | List of project names for dropdown |
| `selectedProject` | `string` | `'All Projects'` | ❌ No | Current project selection |
| `onProjectChange` | `(project: string) => void` | `() => {}` | ❌ No | Called when project changes |
| `taskCounts` | `Map<string, number>` | `null` | ❌ No | Task count badges per project |
| `showProjectFilter` | `boolean` | `false` | ❌ No | Show project selector dropdown |
| `viewMode` | `'list' \| 'graph'` | `'list'` | ❌ No | Current view mode (home page) |
| `onViewModeChange` | `(mode: string) => void` | `() => {}` | ❌ No | Called when view mode changes |

### Responsive Design

The Nav component is fully responsive across all screen sizes, from mobile (320px) to large desktop (1920px+).

**Tailwind Breakpoints Used:**
- `sm`: 640px (Small tablets and above)
- `md`: 768px (Medium tablets and above)
- `lg`: 1024px (Desktop and above)

**Responsive Behavior by Viewport:**

| Viewport | Width | Subtitle | View Buttons | Nav Links | Project Selector |
|----------|-------|----------|--------------|-----------|------------------|
| **Mobile** | 320px - 639px | Hidden | Icons only | Icons only | 144px (w-36) |
| **Small Tablet** | 640px - 767px | Visible | Icons only | Icons only | 160px (w-40) |
| **Tablet** | 768px - 1023px | Visible | Icons + Labels | Icons only | 192px (w-48) |
| **Desktop** | 1024px+ | Visible | Icons + Labels | Icons + Labels | 192px (w-48) |
| **Large Desktop** | 1920px+ | Visible | Icons + Labels | Icons + Labels | 192px (w-48) |

**Implementation Details:**

```svelte
<!-- Subtitle: Hidden on mobile (<640px) -->
<p class="text-sm text-base-content/70 hidden sm:block">
  {config.subtitle}
</p>

<!-- View toggle labels: Visible on tablet+ (≥768px) -->
<span class="hidden md:inline ml-1">List</span>
<span class="hidden md:inline ml-1">Graph</span>

<!-- Navigation link labels: Visible on desktop+ (≥1024px) -->
<span class="hidden lg:inline ml-1">Home</span>
<span class="hidden lg:inline ml-1">Agents</span>

<!-- Project selector: Responsive width -->
<div class="w-36 sm:w-40 md:w-48">
  <ProjectSelector ... />
</div>
```

**Testing Results (Verified):**

✅ **320px (iPhone SE):** Single-row layout, icon-only buttons, no subtitle
✅ **768px (iPad):** Single-row layout, view toggle labels visible, subtitle visible
✅ **1024px (Desktop):** Single-row layout, all labels visible
✅ **1920px (Large Desktop):** Single-row layout, all labels visible, optimal spacing

**Why No Hamburger Menu:**

The Nav component does NOT use a hamburger menu because:
1. **Icon-only mode is sufficient** - All controls remain accessible on mobile
2. **Single-row guarantee** - flex-nowrap prevents wrapping even with all controls
3. **Better UX** - Users can see all options without opening a menu
4. **Fewer clicks** - Direct access to all navigation options

If future pages add many more nav items, consider adding a hamburger menu for mobile.

### Layout Fix: No Wrapping

The Nav component uses **flex-nowrap** to guarantee single-row layout:

```svelte
<div class="flex-none flex flex-nowrap items-center gap-1.5">
  <!-- Controls never wrap to new row -->
</div>
```

**Why this matters:**
- Previous implementation had 3-row wrapping issues
- `flex-nowrap` + optimized spacing (`gap-1.5`) prevents wrap
- Responsive labels (hidden on small screens) save space
- Guaranteed single-row layout across all screen sizes

### Common Patterns

#### Pattern 1: View Toggle with Cross-Page Navigation

```typescript
// In navConfig.ts
viewToggle: [
  { value: 'list', label: 'List View', link: '/' },
  { value: 'agents', label: 'Agent View', link: '/agents' }
]
```

**Use when:** Toggle represents different pages (not modes on same page)

#### Pattern 2: View Mode on Same Page

```typescript
// In navConfig.ts
viewToggle: [
  { value: 'list', label: 'List' },
  { value: 'graph', label: 'Graph' }
]
```

**Use when:** Toggle switches rendering mode without navigation

**Page implementation:**
```svelte
<script>
  let viewMode = $state('list');
</script>

<Nav {viewMode} onViewModeChange={(m) => (viewMode = m)} />

{#if viewMode === 'list'}
  <TaskList />
{:else}
  <TaskGraph />
{/if}
```

#### Pattern 3: Project Filter Integration

```svelte
<script>
  let selectedProject = $state('All Projects');

  // Sync with URL params
  $effect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectParam = params.get('project');
    selectedProject = projectParam || 'All Projects';
  });

  function handleProjectChange(project: string) {
    selectedProject = project;

    // Update URL
    const url = new URL(window.location.href);
    if (project === 'All Projects') {
      url.searchParams.delete('project');
    } else {
      url.searchParams.set('project', project);
    }
    replaceState(url, {});

    // Refetch data with filter
    fetchData();
  }
</script>

<Nav
  context="agents"
  {projects}
  {selectedProject}
  onProjectChange={handleProjectChange}
  showProjectFilter={true}
/>
```

### Icons

Icons are defined inline in Nav component (lines 79-83):

```typescript
const icons = {
  list: 'M3.75 12h16.5m-16.5 3.75h16.5...', // List icon path
  graph: 'M7.5 21L3 16.5m0 0L7.5 12M3...', // Graph icon path
  users: 'M15 19.128a9.38 9.38 0 002.625...' // Users icon path
};
```

**To add new icon:**
1. Get SVG path from Heroicons (https://heroicons.com)
2. Add to `icons` object in Nav.svelte
3. Reference in config: `{ icon: 'myIcon', ... }`

### Migration Path: Inline Config → navConfig.ts

**Current state:** Nav component has inline `contextConfig` (not ideal)

**Goal:** Move all config to `navConfig.ts` for better separation

**Steps:**
1. Export all configs from `navConfig.ts` (already done)
2. Import configs in Nav.svelte
3. Replace inline object with imports
4. Test all pages still work

**Example refactor:**

```typescript
// ❌ Before (inline)
const contextConfig = {
  home: { title: 'Beads Task Dashboard', ... },
  agents: { title: 'Agents', ... }
};

// ✅ After (imported)
import { homeConfig, agentsConfig } from '$lib/config/navConfig';

const contextConfig = {
  home: homeConfig,
  agents: agentsConfig
};
```

### Troubleshooting

**Nav wrapping to multiple rows:**
- Check for `flex-nowrap` on controls container
- Verify `gap-1.5` (not larger)
- Ensure responsive labels are hidden on small screens

**Project filter not showing:**
- Check `showProjectFilter={true}` prop
- Verify `projects` array is populated
- Confirm context supports project filtering

**View toggle not working:**
- Check `onViewModeChange` handler is provided
- Verify `viewMode` is reactive (`$state`)
- Ensure config has `viewToggle` defined

**Icons not displaying:**
- Verify icon name exists in `icons` object
- Check SVG path is valid
- Confirm icon is referenced in config

### Files

**Core files:**
- `src/lib/components/Nav.svelte` - Main component (173 lines)
- `src/lib/config/navConfig.ts` - Configuration (52 lines)
- `src/lib/components/ThemeSelector.svelte` - Theme dropdown (integrated)
- `src/lib/components/ProjectSelector.svelte` - Project dropdown (integrated)

**Usage examples:**
- `src/routes/+page.svelte` - Home page with view toggle
- `src/routes/agents/+page.svelte` - Agents page with project filter
- `src/routes/api-demo/+page.svelte` - Simple page (no extras)

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

## Multi-Project Filtering

### Overview

The dashboard supports multi-project task management with intelligent project detection and filtering. Projects are automatically detected from task ID prefixes (e.g., `chimaro-abc`, `jat-xyz`, `jomarchy-123`).

### How It Works

**Project Detection:**
- Task IDs follow format: `{project}-{hash}` (e.g., `jat-xkp`, `chimaro-42a`)
- Project name is extracted from the prefix before the first hyphen
- Projects are auto-discovered from all loaded tasks
- No manual project configuration needed

**Implementation:** `src/lib/utils/projectUtils.ts`

```typescript
// Extract project from task ID
getProjectFromTaskId("chimaro-abc")  // → "chimaro"
getProjectFromTaskId("jat-xyz")      // → "jat"
getProjectFromTaskId("jomarchy-123") // → "jomarchy"

// Get all unique projects from tasks
getProjectsFromTasks(tasks)
// → ["All Projects", "chimaro", "jat", "jomarchy"]

// Filter tasks by project
filterTasksByProject(tasks, "chimaro")
// → Only chimaro tasks
```

### Where Filters Appear

**1. Navbar (/agents page)**
- Dropdown selector in top navigation bar
- Shows all detected projects
- Displays task count per project
- Example: "jat (8) | chimaro (12) | All Projects (20)"

**2. TaskQueue Sidebar**
- Project filter integrated with task queue
- Filters tasks in sidebar by selected project
- Syncs with navbar selection

**3. URL Parameter**
- Project selection updates URL: `?project=chimaro`
- Bookmarkable URLs (copy/paste preserves selection)
- Page reload preserves last selected project
- Example URLs:
  - `/agents` - All projects
  - `/agents?project=chimaro` - Only chimaro tasks
  - `/agents?project=jat` - Only jat tasks

### Features

**Automatic Detection:**
- No configuration files needed
- Projects discovered from task IDs automatically
- Works with any project naming convention (alphanumeric, hyphens, underscores)
- Handles projects in `~/code/*` structure

**Task Count Display:**
- Shows number of tasks per project
- Updates reactively as tasks change
- Example: "chimaro (15)" means 15 chimaro tasks

**URL Integration:**
- `?project=X` parameter filters view
- Direct links work: Share filtered URLs with team
- Browser back/forward preserves filter state
- Bookmarks remember project selection

**Filter Persistence:**
- Selected project stored in URL (not localStorage)
- Page refresh maintains selection
- Multiple tabs can show different projects
- No cleanup needed (stateless)

### Use Cases

**1. View Single Project:**
```
Navigate to: /agents?project=chimaro
Result: Shows only chimaro-* tasks
```

**2. Switch Projects:**
```
1. Select "jat" from dropdown
2. URL updates to: /agents?project=jat
3. Tasks refresh to show only jat-* tasks
4. Share URL with team for same view
```

**3. View All Projects:**
```
Select "All Projects" from dropdown
URL: /agents (no project param)
Result: Shows all tasks from all projects
```

**4. Bookmarkable Views:**
```
Bookmark: /agents?project=chimaro
Result: Always opens to chimaro tasks
Use case: Dedicated bookmark per project
```

### Integration with Other Filters

Project filter works seamlessly with existing filters:

```
/agents?project=jat&priority=P0&status=open
→ Shows P0 open tasks from jat project only

/agents?project=chimaro&search=authentication
→ Shows chimaro tasks matching "authentication"
```

**Filter precedence:** All filters are AND-ed together (narrow down results).

### Supported Task ID Formats

The project filter handles various task ID formats:

| Format | Project Extracted | Example |
|--------|-------------------|---------|
| `project-hash` | `project` | `jat-abc` → "jat" |
| `multi-word-hash` | `multi-word` | `my-app-xyz` → "my-app" |
| `CAPS-hash` | `caps` | `JAT-123` → "jat" (lowercased) |
| `under_score-hash` | `under_score` | `my_proj-abc` → "my_proj" |

**Invalid formats (no project extracted):**
- `nodashhash` - No hyphen separator
- `-abc` - Empty project prefix
- `abc-` - Empty hash suffix

### Performance

**Optimized for large task lists:**
- Project list computed once per data load
- Filter operation is O(n) on tasks array
- Uses Svelte 5 `$derived` for reactive updates
- No unnecessary re-renders

**Typical performance:**
- 100 tasks: <1ms filter time
- 1000 tasks: <5ms filter time
- 10,000 tasks: <50ms filter time

### For Developers

**Adding project-aware features:**

1. **Get current project:**
```typescript
// From URL
const projectParam = $page.url.searchParams.get('project');

// From selected state
let selectedProject = $state('All Projects');
```

2. **Filter data by project:**
```typescript
import { filterTasksByProject } from '$lib/utils/projectUtils';

const filteredTasks = $derived(
  filterTasksByProject(allTasks, selectedProject)
);
```

3. **Update URL with project:**
```typescript
function handleProjectChange(project: string) {
  const url = new URL(window.location.href);

  if (project === 'All Projects') {
    url.searchParams.delete('project');
  } else {
    url.searchParams.set('project', project);
  }

  goto(url.pathname + url.search);
}
```

**Testing project filter:**
```typescript
// Unit tests in projectUtils.test.ts
test('extracts project from task ID', () => {
  expect(getProjectFromTaskId('chimaro-abc')).toBe('chimaro');
  expect(getProjectFromTaskId('jat-xyz')).toBe('jat');
  expect(getProjectFromTaskId('invalid')).toBeNull();
});
```

### Common Issues

**Project dropdown is empty:**
- Check that tasks have valid ID format: `project-hash`
- Verify tasks are loaded: console.log(tasks)
- Ensure projectUtils is imported correctly

**Filter not working:**
- Verify URL param matches project name exactly
- Check case sensitivity (should be lowercase)
- Ensure $derived is used for reactivity

**Projects not detected:**
- Task IDs must follow `{prefix}-{hash}` format
- Prefix must be non-empty and contain valid characters
- Hash must be non-empty (at least 1 character)

### Files

**Core utilities:**
- `src/lib/utils/projectUtils.ts` - Project detection and filtering logic
- `src/lib/components/agents/ProjectFilter.svelte` - Dropdown component (if exists)
- `src/routes/agents/+page.svelte` - Integration and URL handling

**Related:**
- `src/lib/components/agents/TaskQueue.svelte` - Sidebar filtering
- `src/routes/api/agents/+server.js` - API endpoint (supports ?project param)

### Architectural Decision: Agent Inbox Filtering

**Decision:** Agent inbox is **GLOBAL** (not project-filtered)

**Rationale:**
- Agents are globally unique (one agent name across all projects)
- Cross-project coordination is common (deployments, infrastructure, team broadcasts)
- Splitting inbox by project would make agents miss important messages
- Thread filtering (--thread) provides sufficient focus when needed

**Implementation:**
```javascript
// API: dashboard/src/routes/api/agents/[name]/inbox/+server.js
const command = `am-inbox "${agentName}" --json`;  // No --project flag
```

**For developers:**
- Do NOT add project filtering to agent inbox API
- Agents see ALL messages regardless of project context
- Use thread filtering (`--thread task-id`) for focused message view
- See `dashboard/docs/inbox-filtering-decision.md` for full analysis

**Task:** jat-xkr - Resolved 2025-11-21 by SharpIsle

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
