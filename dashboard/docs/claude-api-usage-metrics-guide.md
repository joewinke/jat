# Claude API Usage Metrics - Developer Guide

## Overview

The dashboard includes a **Claude API Usage Bar** component that displays real-time metrics about Claude API usage, replacing the previous hour-based capacity estimation system. This system provides accurate, data-driven insights into API consumption and rate limits.

**Location:** Fixed bottom-right of screen (hover to expand)

**Component:** `src/lib/components/ClaudeUsageBar.svelte`

**Design Pattern:** Hover-to-expand stats widget (follows chimaro pattern)

## What Metrics Are Displayed

The usage bar shows three primary categories of metrics:

### 1. Subscription Tier Information

**Compact Badge (Default State):**
- Subscription tier (FREE, BUILD, or MAX)
- Per-minute token limit
- Color-coded badge based on tier

**Hover/Expanded State Shows:**
- **Rate Limits by Tier:**
  - Tokens per minute
  - Tokens per day
  - Requests per minute
  - Requests per day

### 2. Session Context (Real-time from API Headers)

**When available** (requires ANTHROPIC_API_KEY environment variable):
- Current per-minute request quota remaining
- Current per-minute input token quota remaining
- Current output token quota remaining
- Reset timestamps for quotas

**Status:** Optional - gracefully degrades to showing tier limits only if API key not configured

### 3. Agent Activity Metrics

**From Agent Mail system** (`am-agents`):
- Total agents registered
- Working agents (active in last 10 minutes)
- Idle agents (active 10-60 minutes ago)
- Sleeping agents (inactive >1 hour)
- System load percentage

## Data Sourcing Architecture

### Tier Detection

**Source:** `~/.claude/.credentials.json`

**Method:** Server-side file read of Claude Code OAuth credentials

**Structure:**
```json
{
  "claudeAiOauth": {
    "subscriptionType": "max",
    "rateLimitTier": "default_claude_max_20x",
    "accessToken": "sk-ant-oat01-...",
    "refreshToken": "...",
    "expiresAt": 1732219234
  }
}
```

**Tier Rate Limits:**

| Tier | Tokens/min | Tokens/day | Requests/min | Requests/day |
|------|------------|------------|--------------|--------------|
| free | 50K | 150K | 50 | 100 |
| build | 200K | 600K | 100 | 2,000 |
| max | 2M | 10M | 2,000 | 10,000 |

**Reference:** [Anthropic Rate Limits Documentation](https://docs.anthropic.com/en/api/rate-limits)

**Implementation:**
```typescript
// src/lib/utils/claudeUsageMetrics.ts
export function getSubscriptionTier(): SubscriptionTier {
  const credPath = path.join(os.homedir(), '.claude/.credentials.json');
  const credentials: ClaudeCredentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
  return credentials.claudeAiOauth.subscriptionType;
}
```

### Session Context Fetching (Optional)

**Source:** Anthropic API rate limit headers

**Requirements:**
1. `ANTHROPIC_API_KEY` environment variable set (separate from OAuth token)
2. `@anthropic-ai/sdk` npm package installed
3. Network access to Anthropic API

**Why Optional:**
Most users don't have a separate Anthropic API key (only OAuth token from Claude.ai). The system gracefully shows tier limits without real-time session context.

**To Enable:**
1. Get API key from https://console.anthropic.com/
2. Set `ANTHROPIC_API_KEY=sk-ant-api03-...` in environment
3. Restart dev server

**Implementation:**
```typescript
// src/lib/utils/claudeUsageMetrics.ts
export async function fetchSessionContext(): Promise<SessionContext | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null; // Graceful degradation
  }

  // Make minimal API call to extract headers
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1,
    messages: [{ role: 'user', content: 'ping' }]
  });

  // Parse rate limit headers
  const headers = (response as any).response?.headers || {};
  return {
    requestsLimit: parseInt(headers['anthropic-ratelimit-requests-limit'] || '0'),
    requestsRemaining: parseInt(headers['anthropic-ratelimit-requests-remaining'] || '0'),
    inputTokensLimit: parseInt(headers['anthropic-ratelimit-input-tokens-limit'] || '0'),
    inputTokensRemaining: parseInt(headers['anthropic-ratelimit-input-tokens-remaining'] || '0'),
    outputTokensRemaining: parseInt(headers['anthropic-ratelimit-output-tokens-remaining'] || '0'),
    // ... reset timestamps
  };
}
```

**Rate Limit Headers:**
- `anthropic-ratelimit-requests-limit` - Max requests per minute
- `anthropic-ratelimit-requests-remaining` - Requests remaining
- `anthropic-ratelimit-requests-reset` - When quota resets (ISO 8601 timestamp)
- `anthropic-ratelimit-input-tokens-limit` - Max input tokens per minute
- `anthropic-ratelimit-input-tokens-remaining` - Input tokens remaining
- `anthropic-ratelimit-output-tokens-remaining` - Output tokens remaining

### Agent Metrics Fetching

**Source:** Agent Mail system (`am-agents` command)

**Implementation:**
```typescript
// src/lib/utils/claudeUsageMetrics.ts
export async function fetchAgentMetrics(): Promise<AgentMetrics | null> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  const { stdout } = await execAsync('am-agents --json');
  const agents = JSON.parse(stdout);

  // Calculate status based on last activity timestamp
  const working = agents.filter(a => {
    const minutesSinceActivity = (Date.now() - new Date(a.last_activity_ts).getTime()) / 60000;
    return minutesSinceActivity < 10; // Active in last 10 minutes
  }).length;

  const idle = agents.filter(a => {
    const minutesSinceActivity = (Date.now() - new Date(a.last_activity_ts).getTime()) / 60000;
    return minutesSinceActivity >= 10 && minutesSinceActivity < 60;
  }).length;

  const sleeping = agents.filter(a => {
    const minutesSinceActivity = (Date.now() - new Date(a.last_activity_ts).getTime()) / 60000;
    return minutesSinceActivity >= 60;
  }).length;

  return {
    totalAgents: agents.length,
    workingAgents: working,
    idleAgents: idle,
    sleepingAgents: sleeping,
    loadPercentage: agents.length > 0 ? Math.round((working / agents.length) * 100) : 0
  };
}
```

**Agent Status Thresholds:**
- **Working:** Active within last 10 minutes
- **Idle:** Active 10-60 minutes ago
- **Sleeping:** Inactive for over 1 hour

## Caching & Refresh Behavior

The system uses a multi-layer caching strategy to prevent API hammering:

### Cache Durations

| Data Type | Cache TTL | Rationale |
|-----------|-----------|-----------|
| Subscription Tier | No cache | Read from local file (instant) |
| Session Context | 30 seconds | Real-time rate limits |
| Agent Metrics | 60 seconds | Reasonable freshness |

### Polling Strategy

**Component-Level:**
- ClaudeUsageBar polls `/api/claude/usage` every **30 seconds**
- Automatic refresh in background (no user interaction needed)
- Uses Svelte 5 `$effect()` for lifecycle management

```svelte
<!-- src/lib/components/ClaudeUsageBar.svelte -->
<script>
  $effect(() => {
    loadMetrics(); // Initial load

    const interval = setInterval(loadMetrics, 30_000); // Poll every 30s

    return () => clearInterval(interval); // Cleanup
  });
</script>
```

**API-Level:**
- `/api/claude/usage` endpoint checks cache first
- Only makes external calls if cache expired
- Returns cached data immediately if available

**Benefits:**
- Reduces Anthropic API calls (1 ping every 30 sec vs 1 per component render)
- Faster response times (cached data served in <1ms)
- Prevents rate limit exhaustion

### Cache Implementation

```typescript
// src/lib/utils/claudeUsageMetrics.ts
class MetricsCache {
  private sessionContextCache: { data: SessionContext; expiresAt: number } | null = null;
  private agentMetricsCache: { data: AgentMetrics; expiresAt: number } | null = null;

  getSessionContext(): SessionContext | null {
    if (!this.sessionContextCache) return null;
    if (Date.now() > this.sessionContextCache.expiresAt) {
      this.sessionContextCache = null;
      return null;
    }
    return this.sessionContextCache.data;
  }

  setSessionContext(data: SessionContext): void {
    this.sessionContextCache = {
      data,
      expiresAt: Date.now() + 30_000 // 30 seconds
    };
  }

  // Similar for agent metrics...
}
```

## Color-Coded Thresholds

### Subscription Tier Badge Colors

| Tier | Badge Color | DaisyUI Class | Visual |
|------|-------------|---------------|--------|
| max | Accent (purple) | `badge-accent` | 🟣 MAX |
| build | Primary (blue) | `badge-primary` | 🔵 BUILD |
| free | Secondary (gray) | `badge-secondary` | ⚪ FREE |

**Implementation:**
```typescript
const tierColor = $derived(
  metrics?.tier === 'max' ? 'badge-accent'
    : metrics?.tier === 'build' ? 'badge-primary'
    : 'badge-secondary'
);
```

### Visual States

**Compact Badge (Default):**
```
┌─────────────────┐
│ 🔌 MAX 2M/min  │  ← Hover for details
└─────────────────┘
```

**Expanded Panel (Hover):**
```
┌─────────────────────────────┐
│ 🔌 MAX Tier                 │
│    Claude API Usage         │
│─────────────────────────────│
│ ⚡ Tokens/min:    2,000,000 │
│ 📅 Tokens/day:   10,000,000 │
│ 🔄 Requests/min:      2,000 │
│ 📊 Requests/day:     10,000 │
└─────────────────────────────┘
```

## Troubleshooting

### Metrics Show "N/A" or Are Missing

**Symptom:** Usage bar appears but shows no data or "N/A" values

**Possible Causes:**

#### 1. Credentials File Missing

```bash
# Check if credentials exist
ls -la ~/.claude/.credentials.json

# Expected output: File exists with read permissions
# If missing: Run Claude Code at least once to generate credentials
```

**Fix:** Launch Claude Code in any project to generate credentials file

#### 2. Malformed Credentials JSON

```bash
# Validate JSON structure
cat ~/.claude/.credentials.json | jq '.'

# Should show valid JSON with claudeAiOauth object
# If error: Backup and regenerate credentials
```

**Fix:**
```bash
# Backup corrupted file
mv ~/.claude/.credentials.json ~/.claude/.credentials.json.backup

# Restart Claude Code to regenerate
```

#### 3. Session Context Unavailable (Expected Behavior)

**Symptoms:**
- Tier badge shows correctly
- Hover panel shows tier limits
- No real-time session context

**This is NORMAL if:**
- `ANTHROPIC_API_KEY` environment variable not set
- System gracefully degrades to showing tier limits only
- Not an error - this is intentional graceful degradation

**To enable real-time session context:**
1. Get Anthropic API key from https://console.anthropic.com/
2. Add to environment: `export ANTHROPIC_API_KEY=sk-ant-api03-...`
3. Restart dev server

#### 4. Agent Metrics Missing

```bash
# Test Agent Mail integration
am-agents --json

# Should return JSON array of agents
# If error: Check Agent Mail installation
```

**Fix:**
```bash
# Install Agent Mail (if not installed)
cd ~/code/jat
./install.sh
```

### Component Not Appearing

**Symptom:** No usage bar visible on screen

**Check:**

#### 1. Verify Component Import

```svelte
<!-- ✅ CORRECT: Root layout only -->
<!-- src/routes/+layout.svelte -->
<script>
  import ClaudeUsageBar from '$lib/components/ClaudeUsageBar.svelte';
</script>

<ClaudeUsageBar />
{@render children()}
```

```svelte
<!-- ❌ WRONG: Individual pages should NOT import -->
<!-- src/routes/some-page/+page.svelte -->
<script>
  import ClaudeUsageBar from '$lib/components/ClaudeUsageBar.svelte'; // DON'T DO THIS
</script>
```

#### 2. Check Console for Errors

```javascript
// Browser DevTools → Console
// Look for: "Error loading Claude usage metrics"
```

**Common errors:**
- `Failed to fetch /api/claude/usage` → API endpoint issue
- `Cannot read property 'tier' of null` → Metrics fetch failed
- `Module not found: @anthropic-ai/sdk` → Missing dependency (OK if ANTHROPIC_API_KEY not set)

#### 3. Verify API Endpoint

```bash
# Test endpoint directly
curl http://localhost:5173/api/claude/usage

# Should return JSON like:
# {
#   "tier": "max",
#   "tierLimits": { ... },
#   "sessionContext": null,
#   "agentMetrics": { ... },
#   ...
# }
```

### High Error Rate

**Symptom:** Console shows repeated "Error fetching session context"

**Cause:** Missing or invalid `ANTHROPIC_API_KEY`

**Solution:**

**If you DON'T need real-time session context:**
- **Ignore this error** - it's expected behavior
- System will gracefully show tier limits without real-time data
- No action needed

**If you WANT session context:**
```bash
# Get API key from Anthropic Console
# https://console.anthropic.com/settings/keys

# Add to environment
export ANTHROPIC_API_KEY=sk-ant-api03-...

# Restart dev server
npm run dev
```

### Browser DevTools Debugging

**Check Component State:**
```javascript
// Open DevTools → Svelte extension
// Select ClaudeUsageBar component
// Inspect state:
// - metrics (should have tier, tierLimits, etc.)
// - isLoading (should be false after initial load)
// - showDetails (true when hovering)
```

**Network Tab:**
```
Filter: /api/claude/usage
Expected: 200 OK responses every 30 seconds
If 500: Check server logs for detailed error
If 404: Verify API route file exists
```

## Architecture & Files

### Component Hierarchy

```
+layout.svelte (root)
  └─ ClaudeUsageBar.svelte
       └─ /api/claude/usage (server endpoint)
            └─ claudeUsageMetrics.ts (utility)
                 ├─ ~/.claude/.credentials.json (tier detection)
                 ├─ Anthropic API (session context, optional)
                 └─ am-agents (agent metrics)
```

### File Reference

**Core Implementation:**
- `src/lib/components/ClaudeUsageBar.svelte` - UI component (200 lines)
  - Hover-to-expand stats widget
  - 30-second polling loop
  - Graceful degradation for missing data

- `src/lib/utils/claudeUsageMetrics.ts` - Data fetching utility (530 lines)
  - Subscription tier detection
  - Session context fetching (optional)
  - Agent metrics aggregation
  - Caching layer

- `src/routes/api/claude/usage/+server.js` - API endpoint (43 lines)
  - Server-side aggregation
  - Error handling with fallbacks
  - Response formatting

**Integration Points:**
- `src/routes/+layout.svelte` - Where component is rendered (global)
- `~/.claude/.credentials.json` - Subscription tier source
- Agent Mail database (`~/.agent-mail.db`) - Agent activity source

**Related Documentation:**
- `dashboard/docs/claude-api-usage-research.md` - Research and design decisions
- `dashboard/CLAUDE.md` - General development guide (references this file)

### API Response Structure

```typescript
interface ClaudeUsageMetrics {
  // Subscription info
  tier: 'free' | 'build' | 'max';
  tierLimits: {
    tokensPerMin: number;
    tokensPerDay: number;
    requestsPerMin: number;
    requestsPerDay: number;
  };

  // Session context (nullable - optional feature)
  sessionContext: {
    requestsLimit: number;
    requestsRemaining: number;
    requestsResetAt: Date;
    inputTokensLimit: number;
    inputTokensRemaining: number;
    inputTokensResetAt: Date;
    outputTokensRemaining: number;
    tier: SubscriptionTier;
    fetchedAt: Date;
  } | null;

  // Agent activity (nullable - requires Agent Mail)
  agentMetrics: {
    totalAgents: number;
    workingAgents: number;
    idleAgents: number;
    sleepingAgents: number;
    loadPercentage: number;
  } | null;

  // Token burn rate (placeholder - not yet implemented)
  burnRate: {
    tokensPerHour: number;
    tokensPerSession: number;
    hoursRemaining: number;
  } | null;

  // Metadata
  lastUpdated: Date;
  cacheHit: boolean;
  errors: string[]; // Non-fatal errors
}
```

## Future Enhancements

**Planned (Not Yet Implemented):**

### 1. Token Burn Rate Estimation

**Goal:** Predict how long current rate limits will last at current usage rate

**Requirements:**
- Store API call samples over time (timestamp, tokens remaining)
- Calculate delta to estimate tokens/hour
- Project hours remaining based on current burn rate

**UI Changes:**
- Add burn rate indicator to expanded panel
- Color-code (green: >5h, yellow: 2-5h, red: <2h)
- Show estimated "time until limit" countdown

### 2. Per-Agent Token Tracking

**Goal:** Show which agents are consuming the most tokens

**Requirements:**
- Parse `~/.claude/projects/{project}/*.jsonl` session files
- Extract `.message.usage` fields (input/output tokens)
- Map session IDs to agent names via `.claude/agent-*.txt` files
- Aggregate by agent name

**UI Changes:**
- Add token usage to AgentCard component tooltips
- Show "This agent used 125K tokens today"
- Color-code high usage agents

**Related Tasks:**
- jat-naq: Create tokenUsage.ts utility module
- jat-oig: Display token usage on AgentCard

### 3. Cost Tracking

**Goal:** Show actual dollar costs of API usage

**Pricing (Claude Sonnet 4.5):**
- Input tokens: $3.00 per million tokens
- Output tokens: $15.00 per million tokens
- Cache writes: $3.75 per million tokens
- Cache reads: $0.30 per million tokens

**Implementation:**
```typescript
function calculateCost(usage: TokenUsage): number {
  const inputCost = (usage.input_tokens / 1_000_000) * 3.00;
  const outputCost = (usage.output_tokens / 1_000_000) * 15.00;
  const cacheWriteCost = (usage.cache_creation_input_tokens / 1_000_000) * 3.75;
  const cacheReadCost = (usage.cache_read_input_tokens / 1_000_000) * 0.30;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}
```

**UI Changes:**
- Show daily/weekly cost estimates
- Budget alerts when approaching monthly limit
- Cost breakdown by agent

### 4. Historical Charts

**Goal:** Visualize token usage trends over time

**Requirements:**
- Store historical usage data (SQLite or JSON)
- Chart library (Chart.js or similar)
- Time range selector (today/week/month/all)

**Charts:**
- Token usage over time (line chart)
- Cost over time (area chart)
- Usage by agent (bar chart)
- Peak usage times (heatmap)

**UI Changes:**
- Add "View History" button to expanded panel
- Show charts in modal or dedicated page
- Export data as CSV

## Task References

- **jat-sk1:** Claude API usage data fetching (completed - FaintRidge)
- **jat-1ux:** Replace SystemCapacityBar with ClaudeUsageBar (completed - RareBrook)
- **jat-ozq:** Document Claude API usage metrics (completed - RareBrook)
- **jat-naq:** Create tokenUsage.ts utility module (in progress - WisePrairie)
- **jat-oig:** Display token usage on AgentCard (pending - WisePrairie)

## Contributing

When modifying this system:

1. **Maintain graceful degradation** - Missing data should never break the UI
2. **Respect cache TTLs** - Don't poll too aggressively
3. **Handle errors silently** - Log to console but show fallback UI
4. **Test without API key** - Most users won't have ANTHROPIC_API_KEY
5. **Document new metrics** - Update this guide when adding features

## Questions?

See:
- Research document: `dashboard/docs/claude-api-usage-research.md`
- Main dev guide: `dashboard/CLAUDE.md`
- Component source: `src/lib/components/ClaudeUsageBar.svelte`
- Utility source: `src/lib/utils/claudeUsageMetrics.ts`
