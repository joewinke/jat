# Agent Orchestration API Documentation

**Version:** 1.0.0
**Last Updated:** 2025-11-20
**Base URL:** `http://localhost:5174/api`

## Overview

The Agent Orchestration API provides real-time access to agent coordination data from Agent Mail and Beads task databases. Designed for reactive frontend consumption with automatic polling.

**Data Sources:**
- **Agent Mail** (`~/.agent-mail.db`) - Agent registrations, file reservations, messages
- **Beads** (`~/code/*/`.beads/beads.db`) - Multi-project task management

**Polling Strategy:**
- Recommended interval: 3000ms (3 seconds)
- Data freshness guarantee: 2000ms
- Use unified `/api/orchestration` endpoint for best performance

---

## Endpoints

### 1. GET `/api/agents`

Returns all registered agents from Agent Mail.

**Query Parameters:**
- None

**Response:**
```json
{
  "agents": [
    {
      "id": 1,
      "name": "FreeMarsh",
      "program": "claude-code",
      "model": "sonnet-4.5",
      "task_description": "Building Agent Orchestration data layer",
      "inception_ts": "2025-11-19 22:11:12",
      "last_active_ts": "2025-11-20 10:28:14",
      "project_path": "/home/jw/code/jomarchy-agent-tools"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:5174/api/agents
```

---

### 2. GET `/api/reservations`

Returns active file reservations from Agent Mail.

**Query Parameters:**
- `agent` (optional) - Filter by agent name

**Response:**
```json
{
  "reservations": [
    {
      "id": 51,
      "path_pattern": "dashboard/src/routes/api/**",
      "exclusive": 1,
      "reason": "jomarchy-agent-tools-ijo: Building data layer API",
      "created_ts": "2025-11-20 10:28:14",
      "expires_ts": "2025-11-20 12:28:14",
      "released_ts": null,
      "agent_name": "FreeMarsh",
      "project_path": "/home/jw/code/jomarchy-agent-tools"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:5174/api/reservations
curl "http://localhost:5174/api/reservations?agent=FreeMarsh"
```

---

### 3. GET `/api/tasks`

Returns tasks from all Beads project databases.

**Query Parameters:**
- `project` (optional) - Filter by project name
- `status` (optional) - Filter by status (open, closed, in_progress, blocked)
- `priority` (optional) - Filter by priority (0-4)

**Response:**
```json
{
  "tasks": [
    {
      "id": "jomarchy-agent-tools-ijo",
      "title": "Create Agent Orchestration data layer",
      "description": "Build data access layer...",
      "status": "open",
      "priority": 0,
      "issue_type": "task",
      "project": "jomarchy-agent-tools",
      "assignee": null,
      "labels": ["agent-coordination", "backend", "dashboard"],
      "created_at": "2025-11-20T05:25:45.343077188-05:00",
      "updated_at": "2025-11-20T05:25:45.343077188-05:00"
    }
  ],
  "projects": ["jomarchy-agent-tools", "chimaro"],
  "count": 485
}
```

**Example:**
```bash
curl http://localhost:5174/api/tasks
curl "http://localhost:5174/api/tasks?project=jomarchy-agent-tools&status=open"
curl "http://localhost:5174/api/tasks?priority=0"
```

---

### 4. GET `/api/tasks/[id]`

Returns detailed information for a specific task including dependencies.

**Path Parameters:**
- `id` - Task ID (e.g., `jomarchy-agent-tools-ijo`)

**Response:**
```json
{
  "task": {
    "id": "jomarchy-agent-tools-ijo",
    "title": "Create Agent Orchestration data layer",
    "description": "Build data access layer...",
    "status": "open",
    "priority": 0,
    "project": "jomarchy-agent-tools",
    "depends_on": [],
    "blocked_by": [],
    "comments": [],
    "labels": ["agent-coordination", "backend"]
  }
}
```

**Example:**
```bash
curl http://localhost:5174/api/tasks/jomarchy-agent-tools-ijo
```

---

### 5. GET `/api/orchestration` ⭐ **Unified Endpoint**

Returns combined agent coordination data from all sources. **Recommended for frontend polling.**

**Query Parameters:**
- `project` (optional) - Filter by project name
- `agent` (optional) - Filter by agent name

**Response:**
```json
{
  "agents": [
    {
      "id": 19,
      "name": "FreeMarsh",
      "program": "claude-code",
      "model": "sonnet-4.5",
      "task_description": "",
      "last_active_ts": "2025-11-20 10:28:14",
      "reservation_count": 2,
      "task_count": 1,
      "open_tasks": 1,
      "in_progress_tasks": 0,
      "active": true
    }
  ],
  "reservations": [...],
  "reservations_by_agent": {
    "FreeMarsh": [...]
  },
  "tasks": [...],
  "unassigned_tasks": [...],
  "task_stats": {
    "total": 485,
    "open": 74,
    "in_progress": 5,
    "blocked": 0,
    "closed": 406,
    "by_priority": {
      "p0": 24,
      "p1": 83,
      "p2": 278,
      "p3": 89,
      "p4": 11
    }
  },
  "tasks_with_deps_count": 32,
  "tasks_with_deps": [...],
  "timestamp": "2025-11-20T10:31:53.392Z",
  "meta": {
    "poll_interval_ms": 3000,
    "data_sources": ["agent-mail", "beads"],
    "cache_ttl_ms": 2000
  }
}
```

**Features:**
- ✅ Combines agents, reservations, and tasks
- ✅ Calculates agent statistics (active, task counts, reservation counts)
- ✅ Groups reservations by agent for easy lookup
- ✅ Provides task statistics and prioritization
- ✅ Identifies unassigned tasks ready for assignment
- ✅ Includes dependency information
- ✅ Provides polling recommendations

**Example:**
```bash
curl http://localhost:5174/api/orchestration
curl "http://localhost:5174/api/orchestration?project=jomarchy-agent-tools"
```

---

## Frontend Integration

### Svelte 5 Store (Recommended)

Use the provided reactive store for automatic polling:

```typescript
// Import the store
import { orchestration } from '$lib/stores/orchestration.svelte';

// In component
$effect(() => {
  // Start polling when component mounts
  orchestration.startPolling();

  // Stop polling when component unmounts
  return () => orchestration.stopPolling();
});

// Access reactive data
const agents = $derived(orchestration.agents);
const tasks = $derived(orchestration.tasks);
const activeAgents = $derived(orchestration.activeAgents);
```

### Manual Polling

```typescript
let data = $state(null);

async function fetchOrchestration() {
  const response = await fetch('/api/orchestration');
  data = await response.json();
}

// Poll every 3 seconds
setInterval(fetchOrchestration, 3000);
```

---

## Data Structures

### Agent
```typescript
interface Agent {
  id: number;
  name: string;
  program: string;
  model: string;
  task_description: string;
  inception_ts: string;
  last_active_ts: string;
  project_path: string;
  // Enhanced fields (orchestration endpoint only)
  reservation_count?: number;
  task_count?: number;
  open_tasks?: number;
  in_progress_tasks?: number;
  active?: boolean;
}
```

### Reservation
```typescript
interface Reservation {
  id: number;
  path_pattern: string;
  exclusive: number; // 1 = exclusive, 0 = shared
  reason: string;
  created_ts: string;
  expires_ts: string;
  released_ts: string | null;
  agent_name: string;
  project_path: string;
}
```

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'blocked' | 'closed';
  priority: 0 | 1 | 2 | 3 | 4; // 0 = highest
  issue_type: 'task' | 'bug' | 'feature' | 'epic';
  project: string;
  project_path: string;
  assignee?: string | null;
  labels: string[];
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  depends_on?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  blocked_by?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Success
- `404 Not Found` - Resource not found (task detail endpoint)
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "error": "Failed to fetch orchestration data",
  "message": "Database connection failed",
  "agents": [],
  "reservations": [],
  "tasks": [],
  "timestamp": "2025-11-20T10:31:53.392Z"
}
```

Errors return partial data where possible to maintain UI stability.

---

## Performance Considerations

### Endpoint Performance
- `/api/agents` - Fast (~10ms)
- `/api/reservations` - Fast (~10ms)
- `/api/tasks` - Moderate (~50-100ms, queries multiple databases)
- `/api/tasks/[id]` - Fast (~10ms)
- `/api/orchestration` - Moderate (~100-150ms, combines all sources)

### Optimization Tips
1. Use `/api/orchestration` instead of calling individual endpoints
2. Poll at recommended 3s interval (avoid < 1s)
3. Filter by project when possible to reduce data transfer
4. Limit task count is capped at 100 for performance

### Data Freshness
- Agent activity updates: Real-time (via DB triggers)
- Reservations: Real-time (via DB triggers)
- Tasks: Updated when `bd` CLI commands run
- Recommended poll interval balances freshness vs performance

---

## Testing

**Quick Test:**
```bash
# Test all endpoints
curl http://localhost:5174/api/agents | jq
curl http://localhost:5174/api/reservations | jq
curl http://localhost:5174/api/tasks | jq
curl http://localhost:5174/api/orchestration | jq
```

**Load Testing:**
```bash
# Simulate 10 concurrent frontend polls
for i in {1..10}; do
  (curl -s http://localhost:5174/api/orchestration > /dev/null) &
done
wait
```

---

## Implementation Notes

### Database Access
- Uses `better-sqlite3` for SQLite access
- Read-only connections for safety
- Agent Mail DB: `~/.agent-mail.db`
- Beads DBs: Scans `~/code/*/`.beads/beads.db`

### Multi-Project Support
- Automatically discovers all Beads projects
- Aggregates tasks across projects
- Preserves project context in task data

### Reactive Updates
Frontend stores should:
1. Poll `/api/orchestration` every 3s
2. Update local state on successful response
3. Handle errors gracefully (keep stale data)
4. Clean up intervals on component unmount

---

## Changelog

**v1.0.0** (2025-11-20)
- Initial release
- All 5 endpoints implemented
- Svelte 5 reactive store
- Multi-project Beads support
- Agent activity tracking
- File reservation conflicts

---

## Support

For issues or questions:
- Check dashboard logs: `cd dashboard && npm run dev`
- Verify database paths: `ls ~/.agent-mail.db`
- Check Beads projects: `ls ~/code/*/.beads/`
- Report issues: GitHub Issues

## Related Documentation

- [Agent Mail CLI Tools](../README.md#agent-mail-tools)
- [Beads Task Management](../README.md#beads-integration)
- [Dashboard Development](./CLAUDE.md)
