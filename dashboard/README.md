# Beads Task Dashboard

A modern, real-time task management dashboard for multi-project Beads workflows. Built with SvelteKit 5, Tailwind CSS, and DaisyUI.

[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte)](https://svelte.dev)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2-FF3E00)](https://kit.svelte.dev)
[![DaisyUI](https://img.shields.io/badge/DaisyUI-32%20Themes-5A0EF8)](https://daisyui.com)

![Dashboard Screenshot](./dashboard-screenshot.png)
*Beads Task Dashboard with dependency graph visualization showing task relationships*

## Overview

The Beads Task Dashboard provides a unified web interface for viewing and managing tasks across multiple projects using the [Beads CLI](https://github.com/steveyegge/beads). It aggregates tasks from all your project repositories in `~/code/*` and displays them with powerful filtering, search, and real-time updates.

**Key Features:**

- **Multi-Project View** - Aggregates tasks from all projects in `~/code/*` with intelligent project detection
- **Project Filtering** - Filter by project via dropdown or URL parameter (`?project=chimaro`)
- **Dependency Graph Visualization** - Interactive D3.js force-directed graph showing task relationships
- **Advanced Filtering** - Filter by project, priority (P0-P3), status, and search query
- **32 DaisyUI Themes** - Switch between light/dark themes with live preview
- **Real-Time Updates** - Auto-refresh every 30 seconds, manual refresh on demand
- **Svelte 5 Runes** - Modern reactivity with `$state`, `$derived`, and `$effect`
- **Task Details Modal** - View full task information including dependencies and history
- **List & Graph Views** - Toggle between traditional list and visual dependency graph
- **Responsive Design** - Works on desktop, tablet, and mobile

## Installation

### Prerequisites

- Node.js 18+ (or bun/pnpm)
- [Jomarchy Agent Tools](https://github.com/joewinke/jat) installed
- [Beads CLI](https://github.com/steveyegge/beads) installed and configured
- Projects with `.beads/` directories in `~/code/*`

### Quick Start

```bash
# Navigate to dashboard directory
cd ~/code/jat/dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://127.0.0.1:5173
```

The dashboard will automatically scan `~/code/*` for projects with Beads databases and aggregate all tasks.

## Usage

### Viewing Tasks

The dashboard displays all tasks from your Beads-enabled projects. Each task shows:

- **Project Badge** - Color-coded by project (e.g., `chimaro-abc`, `jomarchy-xyz`)
- **Priority Badge** - P0 (Critical/Red) through P3 (Low/Green)
- **Title** - Task summary
- **Description** - Brief description (expandable)
- **Labels** - Categorization tags

### Filtering

Use the filter controls at the top to narrow down tasks:

- **Project** - Show tasks from specific project or all projects
- **Priority** - Filter by P0, P1, P2, P3, or all
- **Status** - Open or Closed tasks
- **Search** - Free-text search across titles and descriptions

Filters are reactive and update instantly using Svelte 5's `$derived` rune.

#### Multi-Project Filtering

The dashboard automatically detects projects from task ID prefixes (e.g., `chimaro-abc`, `jat-xyz`, `jomarchy-123`) and provides intelligent filtering:

**Key Features:**
- **Automatic Detection** - Projects discovered from task IDs, no configuration needed
- **URL-Based** - Filter via `?project=chimaro` parameter (bookmarkable)
- **Task Counts** - Shows task count per project in dropdown
- **Persistence** - Page reload preserves selected project
- **Shareable** - Copy URL to share filtered view with team

**Example URLs:**
```
/agents                      → All projects
/agents?project=chimaro      → Only chimaro tasks
/agents?project=jat          → Only jat tasks
```

**Combined Filters:**
```
/agents?project=jat&priority=P0&status=open
→ Shows P0 open tasks from jat project only
```

For developer documentation on project filtering, see `dashboard/CLAUDE.md`.

### Task Details

Click any task to open the modal with complete information:

- Full description
- Creation and update timestamps
- Dependencies (blocking/blocked by)
- Labels and metadata
- Status and priority

### Dependency Graph Visualization

Click the "Graph" button in the navbar to switch to the interactive dependency graph view.

**Features:**

- **Force-Directed Layout** - D3.js automatically arranges tasks to show relationships clearly
- **Color-Coded Status** - Nodes colored by task status:
  - Blue: Open tasks
  - Orange: In Progress tasks
  - Green: Closed/completed tasks
  - Red: Blocked tasks
- **Priority Indicators** - Border width shows priority (P0=thickest, P3=thinnest)
- **Interactive Controls:**
  - Drag nodes to rearrange
  - Zoom in/out with mouse wheel
  - Pan by dragging background
  - Click nodes to select (ready for modal integration)
- **Dependency Arrows** - Arrows point from dependencies to dependent tasks
- **Legend** - Visual guide showing status colors and priority indicators
- **Real-Time Updates** - Graph updates with task changes

**When to Use Graph View:**

- Visualizing complex dependency chains
- Finding blocked tasks at a glance
- Understanding project structure
- Planning work order based on dependencies
- Identifying orphaned or isolated tasks

### Theme Switching

Click the theme selector in the top-right to preview and apply any of 32 DaisyUI themes:

- Light themes: `light`, `cupcake`, `bumblebee`, `emerald`, `corporate`, etc.
- Dark themes: `dark`, `synthwave`, `halloween`, `forest`, `black`, etc.

Theme preference is saved to localStorage and persists across sessions.

### Auto-Refresh

The dashboard auto-refreshes every 30 seconds to stay in sync with Beads task changes. You can also manually refresh using the "Refresh" button.

## Architecture

### Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Styling**: Tailwind CSS 4 + DaisyUI 5
- **Visualization**: D3.js 7 (force-directed graphs, interactive SVG)
- **Database**: Better-SQLite3 (reads Beads `.beads/*.jsonl` databases)
- **Build**: Vite 7
- **Adapter**: @sveltejs/adapter-node (for production deployment)

### Project Structure

```
dashboard/
├── src/
│   ├── app.css                  # Global styles
│   ├── app.html                 # HTML template
│   ├── routes/
│   │   ├── +layout.svelte       # Root layout
│   │   ├── +page.svelte         # Main dashboard page
│   │   └── api/
│   │       └── tasks/
│   │           └── +server.ts   # API endpoint for task data
│   └── lib/
│       └── components/
│           ├── TaskList.svelte         # Main task list component
│           ├── TaskModal.svelte        # Task detail modal
│           ├── DependencyGraph.svelte  # D3.js dependency visualization
│           └── ThemeSelector.svelte    # DaisyUI theme picker
├── package.json
├── svelte.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### Data Flow

1. **Frontend** (`+page.svelte`) renders filters and `TaskList` component
2. **TaskList** fetches data from `/api/tasks` endpoint
3. **API** (`/api/tasks/+server.ts`) scans `~/code/*/.beads/beads.base.jsonl` files
4. **API** parses JSONL, aggregates tasks, extracts project names from IDs
5. **TaskList** receives `{ tasks, projects }` and displays with reactive filtering
6. **Auto-refresh** polls every 30s via `setInterval` + `$effect` cleanup

### Svelte 5 Reactivity Approach

This dashboard showcases Svelte 5's new runes-based reactivity system:

#### `$state` - Reactive State

```svelte
let tasks = $state([]);
let selectedProject = $state('all');
let loading = $state(true);
```

State variables automatically trigger re-renders when changed. No more `let x = ...` ambiguity.

#### `$derived` - Computed Values

```svelte
const filteredTasks = $derived(
  tasks.filter(task => {
    if (selectedProject !== 'all' && task.project !== selectedProject) return false;
    if (selectedPriority !== 'all' && task.priority !== parseInt(selectedPriority)) return false;
    return true;
  })
);
```

Derived values automatically recompute when dependencies change. More explicit than `$:` reactive statements.

#### `$effect` - Side Effects

```svelte
$effect(() => {
  fetchTasks(); // Initial load
  const interval = setInterval(() => fetchTasks(true), 30000);
  return () => clearInterval(interval); // Cleanup
});
```

Effects run when dependencies change and support cleanup functions. Replaces `onMount` + `onDestroy` pattern.

#### `$bindable` - Two-Way Binding

```svelte
let {
  selectedProject = $bindable('all'),
  selectedPriority = $bindable('all'),
  selectedStatus = $bindable('all')
} = $props();
```

Props can be bound bidirectionally between parent and child components, replacing `bind:` directive syntax.

### Why Svelte 5 Runes?

- **Explicit Reactivity** - Clear which variables are reactive (`$state`) vs static
- **Better TypeScript** - Runes integrate seamlessly with TS type inference
- **Cleaner Syntax** - No more `$:` reactive statements or prop destructuring gotchas
- **Universal Reactivity** - Works in `.svelte` and `.svelte.ts` files
- **Signal-Based** - Fine-grained reactivity similar to Solid.js/Qwik

### UI Pattern: Unified Queue/Drop Zone

The AgentCard component implements a merged Queue/Drop Zone pattern that reduces visual clutter and improves UX.

#### Design Decision

Instead of having separate "Queued Tasks" and "Drop Zone" sections, we merged them into a single unified section. This decision was informed by user feedback and design testing.

**Benefits:**
- **Reduces redundancy** - One section instead of two saves space
- **Lowers cognitive load** - Cleaner interface, less visual noise
- **Natural drop target** - Entire queue area is droppable, not just an empty box
- **Better space utilization** - More room for task content

#### Visual States

The unified Queue section has 5 distinct visual states:

**1. Default (Has Queued Tasks)**
- Solid border with neutral color
- Shows up to 3 tasks with title
- "+N more" indicator if additional tasks queued

**2. Drag Over + Success (Ready to Drop)**
- Dashed **green** border (`border-success border-dashed`)
- Light green background tint (`bg-success/10`)
- Checkmark icon + "Drop to assign to {AgentName}" message
- Subtle scale-up effect (`scale-105`)

**3. Drag Over + Dependency Block (Cannot Drop)**
- Dashed **red** border (`border-error border-dashed`)
- Light red background tint (`bg-error/10`)
- X icon + "Dependency Block!" header
- Shows specific blocking task/reason
- Drop is prevented (`dropEffect: none`)

**4. Drag Over + File Conflict (Cannot Drop)**
- Dashed **red** border (`border-error border-dashed`)
- Light red background tint (`bg-error/10`)
- Warning icon + "File Conflict!" header
- Lists conflicting file patterns inline
- Drop is prevented (`dropEffect: none`)

**5. Assigning (Loading)**
- Loading spinner animation
- "Assigning task..." message
- Disabled pointer events during assignment
- Overlay with backdrop blur

#### Drag-Drop Interaction Flow

```
1. User drags task from sidebar
   ↓
2. Mouse enters agent card → handleDragOver()
   ↓
3. Check task dependencies (analyzeDependencies)
   ↓
4. Check file reservation conflicts (detectConflicts)
   ↓
5. Show appropriate visual state (success/block/conflict)
   ↓
6. User drops → handleDrop()
   ↓
7. Validate dependencies/conflicts again
   ↓
8. Call API to assign task
   ↓
9. Show loading state, then success/error
```

#### Error Handling Approach

Errors are displayed **inline** (not toasts/modals) for immediate context:

- **Dependency blocks** - Shows which task needs to be completed first
- **File conflicts** - Lists exact file patterns that conflict
- **Assignment errors** - Displays API error message with 5-second auto-dismiss
- **Detailed messages** - Users understand *why* action failed and how to fix it

#### Implementation Details

**State Management:**
```svelte
let isDragOver = $state(false);       // Is mouse over drop zone?
let hasConflict = $state(false);      // Are there file conflicts?
let hasDependencyBlock = $state(false); // Are dependencies unmet?
let isAssigning = $state(false);      // Is assignment in progress?
let assignError = $state(null);       // Assignment error message
```

**Drop Behavior:**
- Entire queue section is a drop target (not just empty space)
- Parent card component handles drop event (lines 183-235 in `AgentCard.svelte`)
- Conflict detection runs on `dragover` (lines 322-344)
- New tasks appear at **top** of queue after assignment
- Visual feedback is immediate and reactive

**File Location:**
- Component: `src/lib/components/agents/AgentCard.svelte` (lines 627-693)
- Documentation: Comprehensive comment block explains pattern rationale

#### User Preferences That Informed Design

This pattern emerged from user testing and feedback:

✅ **Preferred:**
- Cleaner, less busy interface
- Inline error messages (not modals)
- Entire section as drop target
- Detailed, actionable error messages

❌ **Rejected:**
- Separate drop zone (felt redundant)
- Toast/modal notifications (lose context)
- Small drop zones (hard to target)
- Generic error messages ("failed to assign")

#### For Contributors

When working with the Queue/Drop Zone pattern:

1. **Keep visual feedback clear** - Colors and icons should be obvious
2. **Show specific errors** - Tell users *exactly* what's wrong and how to fix it
3. **Don't change drop target** - Entire section should remain droppable
4. **Preserve states** - All 5 states serve a purpose, don't remove any
5. **Test edge cases** - Try dragging tasks with dependencies, conflicts, etc.

See code comments in `AgentCard.svelte` (lines 627-690) for detailed implementation notes.

## Development

### Available Scripts

```bash
npm run dev        # Start dev server (http://127.0.0.1:5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run check      # Type-check with svelte-check
```

### API Endpoints

#### `GET /api/tasks`

Returns aggregated task data from all Beads projects:

```json
{
  "tasks": [
    {
      "id": "chimaro-abc",
      "project": "chimaro",
      "title": "Fix authentication bug",
      "description": "Users can't log in...",
      "status": "open",
      "priority": 0,
      "labels": ["security", "auth"],
      "created_at": "2025-11-19T10:30:00Z",
      "updated_at": "2025-11-19T15:45:00Z"
    }
  ],
  "projects": ["chimaro", "jomarchy", "jat"]
}
```

### Adding New Features

Example: Adding a "Label Filter"

1. **Add state** in `+page.svelte`:
   ```svelte
   let selectedLabel = $state('all');
   ```

2. **Pass to TaskList** via `$bindable`:
   ```svelte
   <TaskList bind:selectedLabel />
   ```

3. **Update filter logic** in `TaskList.svelte`:
   ```svelte
   const filteredTasks = $derived(
     tasks.filter(task => {
       if (selectedLabel !== 'all' && !task.labels.includes(selectedLabel)) return false;
       // ... other filters
     })
   );
   ```

4. **Add UI** in filter section:
   ```svelte
   <select bind:value={selectedLabel}>
     <option value="all">All Labels</option>
     {#each uniqueLabels as label}
       <option value={label}>{label}</option>
     {/each}
   </select>
   ```

## Production Deployment

### Build for Production

```bash
npm run build
```

Outputs to `build/` directory with `@sveltejs/adapter-node`.

### Run in Production

```bash
node build/index.js
```

Or use a process manager:

```bash
pm2 start build/index.js --name beads-dashboard
```

### Environment Variables

- `PORT` - Server port (default: 3000)
- `HOST` - Bind address (default: 127.0.0.1)

```bash
PORT=8080 HOST=0.0.0.0 node build/index.js
```

### Reverse Proxy (Nginx)

```nginx
server {
  listen 80;
  server_name beads.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

## Troubleshooting

### Tasks Not Appearing

**Issue**: Dashboard shows "No tasks found"

**Solutions**:
- Ensure Beads databases exist in `~/code/*/.beads/beads.base.jsonl`
- Check API response at `http://127.0.0.1:5173/api/tasks`
- Verify permissions on `.beads/` directories
- Check browser console for fetch errors

### Theme Not Persisting

**Issue**: Theme resets on page reload

**Solutions**:
- Check browser localStorage (DevTools → Application → localStorage)
- Ensure `theme-change` package is installed: `npm ls theme-change`
- Clear localStorage and try selecting theme again

### Auto-Refresh Not Working

**Issue**: Tasks don't update every 30s

**Solutions**:
- Check browser console for errors
- Verify `$effect` cleanup is running (no memory leaks)
- Test manual refresh button to isolate issue

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

### Running Tests

```bash
npm run check       # Type checking
npm run lint        # Linting (if configured)
```

## License

MIT - See [LICENSE](../LICENSE) for details.

## Related Projects

- [Beads CLI](https://github.com/steveyegge/beads) - Dependency-aware task planning
- [Jomarchy Agent Tools](https://github.com/joewinke/jat) - Multi-agent coordination
- [Agent Mail](../tools/am-*) - Bash-based agent messaging and file locks

## Support

- **Issues**: [GitHub Issues](https://github.com/joewinke/jat/issues)
- **Docs**: [Main README](../README.md)
- **Discord**: [Join Community](https://discord.gg/example) <!-- Update with real link -->
