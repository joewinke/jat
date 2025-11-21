# Architectural Decision: Agent Inbox Filtering Behavior

**Status:** ✅ DECIDED
**Date:** 2025-11-21
**Decider:** SharpIsle
**Task:** jat-xkr

## Context

The `/api/agents/[name]/inbox` endpoint uses bash `am-inbox` tool which supports project filtering via `--project` flag, but the API doesn't use it. The JS `getInboxForThread()` function also supports `projectPath` parameter. The question is whether agent inbox should be:

A) **Global** - Show messages from all projects
B) **Project-specific** - Filter by project parameter

## Decision

**✅ Agent inbox should be GLOBAL (Option A)**

Keep the current behavior where agents see ALL messages regardless of project context.

## Rationale

### 1. Agents Are Globally Unique

From project documentation:
- Agent names are globally unique across all projects
- Same agent cannot exist in multiple projects
- One agent identity = one global inbox

**Consistency principle:** If agents are global, their inbox should be global too.

### 2. Cross-Project Coordination

Agents frequently work across multiple projects:
- Shared infrastructure (deployments, monitoring)
- Cross-cutting concerns (security, performance)
- Team coordination (@active, @all broadcasts)

**Example scenario:**
```
Agent "DevBot" works on both:
- chimaro project: Frontend tasks
- jat project: Tooling tasks

DevBot receives:
- chimaro-abc thread: "PR ready for review"
- jat-xyz thread: "Build failing, needs fix"
- @all broadcast: "Deployment in 5 minutes"

DevBot needs to see ALL of these, not filtered by current project.
```

### 3. Message-Level Filtering Already Exists

Agents can filter by **thread** (not project) when needed:

```bash
am-inbox AgentName --thread chimaro-abc  # View specific task thread
am-inbox AgentName --thread deploy-2025  # View deployment thread
```

This provides focused context without splitting the inbox.

### 4. User Experience Benefits

**Global inbox (current):**
- ✅ One inbox to check
- ✅ No missed messages from other projects
- ✅ Natural for globally-scoped agents
- ✅ Simpler mental model

**Project-filtered inbox (alternative):**
- ❌ Must check multiple inboxes
- ❌ Easy to miss important messages
- ❌ Adds complexity without clear benefit
- ❌ Inconsistent with global agent model

### 5. Implementation Already Correct

The current implementation is:
```javascript
const command = `am-inbox "${agentName}" --json`;
```

This correctly shows global inbox. No changes needed.

## Consequences

### Positive

- ✅ No code changes required
- ✅ Consistent with agent identity model
- ✅ Simpler for users (one inbox to check)
- ✅ Supports cross-project coordination naturally

### Negative

- ⚠️ Cannot filter inbox by project in UI
- ⚠️ High-volume agents may have cluttered inbox

### Mitigation for Negatives

For agents needing project focus:
1. Use thread filtering: `--thread project-task-id`
2. Use labels/importance filtering
3. Consider creating project-specific agents if needed

## Alternative Considered: Hybrid Approach

**Option C:** Keep global inbox but add OPTIONAL project filter in UI

```javascript
// API supports optional ?project= parameter
GET /api/agents/AgentName/inbox?project=chimaro

// JavaScript wrapper
getInboxForThread(agentName, null, { projectPath: 'chimaro' })
```

**Rejected because:**
- Adds complexity without strong use case
- Most agents benefit from global view
- Thread filtering provides sufficient focus
- Can revisit if user feedback demands it

## Implementation Notes

### API Endpoint

**Current (keep as-is):**
```javascript
// dashboard/src/routes/api/agents/[name]/inbox/+server.js
const command = `am-inbox "${agentName}" --json`;
```

**If future need arises:**
```javascript
// Optional enhancement (not implemented now)
const projectParam = url.searchParams.get('project');
const projectFlag = projectParam ? `--project "${projectParam}"` : '';
const command = `am-inbox "${agentName}" ${projectFlag} --json`;
```

### Documentation Updates

- [x] Mark decision in this document
- [ ] Update API documentation (if exists)
- [ ] Add note to CLAUDE.md about global inbox behavior
- [ ] Close jat-xkr with decision summary

## Decision Log

| Date | Change | Reason |
|------|--------|--------|
| 2025-11-21 | Decision: Global inbox | Consistent with global agent model, supports cross-project work |

## Related

- **Task:** jat-xkr - "Clarify inbox filtering behavior for global agents"
- **Found during:** jat-qzq audit
- **Documentation:** `dashboard/CLAUDE.md` - Agent identity and multi-project filtering
- **Code:** `dashboard/src/routes/api/agents/[name]/inbox/+server.js`
