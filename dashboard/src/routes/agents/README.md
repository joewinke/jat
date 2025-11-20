# Agents View

## Overview

Visual task assignment interface for Agent Mail + Beads coordination. Provides drag-and-drop task assignment to agents with conflict detection and auto-assignment capabilities.

## Implementation Status

**Task ID**: `jat-dlj` (P0 - Complete)

### ✅ Completed (P0 - Foundation)

- **Main Layout** (`+page.svelte`)
  - Two-panel layout: Task queue sidebar + Agent grid
  - Navigation integration with existing dashboard
  - Theme-aware styling (works with all 32 DaisyUI themes)
  - Auto-refresh data polling every 5 seconds via `$effect`

- **Task Queue Component** (`TaskQueue.svelte`)
  - Search functionality (title + description)
  - Filter by priority (P0/P1/P2/P3)
  - Filter by status (open/blocked/ready)
  - Filter by labels (dynamic from tasks)
  - Reactive filtering using Svelte 5 `$derived`
  - Task count display
  - Draggable task cards (preparation for drag-drop)
  - Empty state with clear filters button

- **Agent Grid Component** (`AgentGrid.svelte`)
  - Responsive grid layout (1-4 columns based on screen size)
  - Toolbar with action buttons (Auto-Assign, Smart Balance, Refresh)
  - Empty state with helpful messaging
  - System capacity progress bar (placeholder for P2)

- **Agent Card Component** (`AgentCard.svelte`)
  - Agent name, program, model display
  - Status badge (active/idle/blocked/offline)
  - Current task display with progress bar
  - Queued tasks list (up to 3, expandable)
  - File locks display (up to 2, expandable)
  - Drop zone for task assignment (placeholder for P1)

### 🚧 Pending (P1 Tasks - To be implemented)

These features are **intentionally incomplete** and will be built in dependent tasks:

- **Drag-and-Drop** (`jat-c37`)
  - Task cards are draggable (HTML5 drag API ready)
  - Agent cards have drop zones (event handlers stubbed)
  - Actual assignment logic not yet implemented

- **Conflict Detection** (`jat-0nu`)
  - File reservation checking during drag
  - Visual feedback (red overlay for conflicts, green for allowed)
  - Prevent invalid assignments

- **Agent Status Display** (`jat-5bk`)
  - Real-time agent status computation
  - Current task tracking
  - Queue management
  - File lock association

- **Auto-Assign Logic** (`jat-kpw`)
  - Smart task assignment algorithm
  - Conflict avoidance
  - Preview before applying

- **Task Queue Filtering** (`jat-zdl`)
  - URL persistence for filter state
  - More advanced filtering options

### 🔮 Future (P2 Tasks - Enhancements)

- **Capacity Visualization** (`jat-m68`)
  - Per-agent capacity bars
  - Time estimates
  - Load balancing indicators

- **Dependency Visualization** (`jat-d6g`)
  - Show blocking/blocked status on cards
  - Dependency chain tooltips

- **Quick Actions** (`jat-dz0`)
  - Right-click context menu on agent cards
  - View inbox, file locks, send message, etc.

## File Structure

```
src/routes/agents/
├── +page.svelte                        # Main agents view
└── README.md                           # This file

src/lib/components/agents/
├── TaskQueue.svelte                    # Left sidebar: unassigned tasks
├── AgentGrid.svelte                    # Right panel: agent columns
└── AgentCard.svelte                    # Individual agent display
```

## Data Flow

**Current (Mock Data)**:
- All components receive empty arrays as props
- Components render empty states gracefully
- No backend API integration yet

**Future (After P0 Backend Task)**:
- Main page will fetch from `/api/agent-data` endpoint
- Data refreshes every 5 seconds via Svelte `$effect`
- Components use reactive `$derived` for computed values

## Theme Compatibility

**Verified**: All components use DaisyUI semantic classes that adapt to all 32 themes:
- `bg-base-100`, `bg-base-200` (backgrounds)
- `text-base-content` (text colors)
- `border-base-300` (borders)
- `badge-error`, `badge-warning`, `badge-info`, `badge-success` (status indicators)
- Theme-aware hover states

**Testing**: Manually switch themes using ThemeSelector component - layout should remain coherent.

## Responsive Design

**Breakpoints**:
- Mobile (< 768px): 1 column agent grid
- Tablet (768px - 1024px): 2 columns
- Desktop (1024px - 1280px): 3 columns
- Large (>= 1280px): 4 columns

**Task Queue Sidebar**: Fixed width (320px) on desktop, collapsible on mobile (future enhancement).

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators on all clickable elements

## Usage

Navigate to `/agents` in the dashboard:

```
http://localhost:5174/agents
```

**Current State**: Empty state view (no agents, no tasks) until backend API is implemented.

## Dependencies

**Backend API** (Task `jat-ijo`):
- `/api/agent-data` - Unified endpoint for agents, tasks, reservations
- Data structure TBD by backend team

**Integration Points**:
- Agent Mail (`am-agents`, `am-reservations`)
- Beads (`bd list --json`, `bd show --json`)

## Development Notes

**Svelte 5 Runes Used**:
- `$state` - Reactive component state
- `$derived` - Computed values (filtering, status)
- `$props` - Component props
- `$effect` - Side effects (auto-refresh polling)

**Tailwind v4 Syntax**:
- Uses semantic utility classes compatible with v4
- No custom CSS needed
- All styling via DaisyUI + Tailwind utilities

## Acceptance Criteria ✅

- [x] Layout renders with task queue + agent columns
- [x] Responsive grid (adapts to screen size)
- [x] Theme-aware (works with all 32 DaisyUI themes)
- [x] Filter/search placeholders in task queue
- [x] Empty agent card components
- [x] No functionality yet (just visual layout)
- [x] Clean, maintainable component structure
- [x] Proper Svelte 5 runes usage
- [x] Empty states handled gracefully

## Next Steps

1. **Wait for backend API** (`jat-ijo`) to be completed
2. **Integrate data fetching** - Replace mock data with API calls
3. **Implement drag-drop** (`jat-c37`) - Make task assignment functional
4. **Add conflict detection** (`jat-0nu`) - Prevent invalid assignments
5. **Build out agent status** (`jat-5bk`) - Show real-time agent state

## Related Tasks

- `jat-ijo` (P0) - Backend data layer (parallel work)
- `jat-c37` (P1) - Drag-and-drop implementation
- `jat-0nu` (P1) - Conflict detection
- `jat-5bk` (P1) - Agent status display
- `jat-kpw` (P1) - Auto-assign logic
- `jat-zdl` (P1) - Enhanced filtering
- `jat-dz0` (P2) - Quick actions menu
- `jat-m68` (P2) - Capacity visualization
- `jat-d6g` (P2) - Dependency visualization
