# Claude API Usage Metrics Research

**Task:** jat-bgx
**Date:** 2025-11-21
**Agent:** WisePrairie

## Executive Summary

This document provides research findings on accessing Claude API usage metrics for dashboard display. Anthropic provides three primary data sources for usage tracking:

1. **Rate Limit Headers** (Real-time) - Per-request quota remaining
2. **Cost Report API** (Historical) - Detailed cost breakdown by model/workspace
3. **Claude Code Analytics API** (Daily) - Developer productivity metrics

## Data Sources

### 1. Rate Limit Headers (Real-Time Session Context)

**Access Method:** API response headers on every request
**Refresh Rate:** Real-time (every API call)
**Authentication:** Standard API key (`sk-ant-api...`)

#### Available Metrics

| Header | Description |
|--------|-------------|
| `anthropic-ratelimit-requests-limit` | Max requests per minute |
| `anthropic-ratelimit-requests-remaining` | Requests remaining |
| `anthropic-ratelimit-requests-reset` | When limit resets (RFC 3339) |
| `anthropic-ratelimit-input-tokens-limit` | Max input tokens per minute |
| `anthropic-ratelimit-input-tokens-remaining` | Input tokens remaining |
| `anthropic-ratelimit-input-tokens-reset` | When input limit resets |
| `anthropic-ratelimit-output-tokens-remaining` | Output tokens remaining |
| `retry-after` | Seconds to wait before retry |

**Notes:**
- Headers show "the most restrictive limit currently in effect"
- Token values rounded to nearest thousand
- Separate `anthropic-priority-*` headers for Priority Tier
- **Does NOT provide weekly/daily quota totals**

#### Code Example (Node.js/SvelteKit)

```typescript
// src/lib/api/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

export interface RateLimitInfo {
  requestsLimit: number;
  requestsRemaining: number;
  requestsReset: Date;
  inputTokensLimit: number;
  inputTokensRemaining: number;
  inputTokensReset: Date;
  outputTokensRemaining: number;
}

export async function getSessionContext(apiKey: string): Promise<RateLimitInfo> {
  const client = new Anthropic({ apiKey });

  // Make minimal API call to get rate limit headers
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1,
    messages: [{
      role: 'user',
      content: 'ping' // Minimal token usage
    }]
  });

  // Extract headers from response
  const headers = response.headers; // Access raw HTTP headers

  return {
    requestsLimit: parseInt(headers['anthropic-ratelimit-requests-limit']),
    requestsRemaining: parseInt(headers['anthropic-ratelimit-requests-remaining']),
    requestsReset: new Date(headers['anthropic-ratelimit-requests-reset']),
    inputTokensLimit: parseInt(headers['anthropic-ratelimit-input-tokens-limit']),
    inputTokensRemaining: parseInt(headers['anthropic-ratelimit-input-tokens-remaining']),
    inputTokensReset: new Date(headers['anthropic-ratelimit-input-tokens-reset']),
    outputTokensRemaining: parseInt(headers['anthropic-ratelimit-output-tokens-remaining'])
  };
}
```

**SvelteKit API Route:**

```typescript
// src/routes/api/usage/session/+server.ts
import { json } from '@sveltejs/kit';
import { getSessionContext } from '$lib/api/anthropic';

export async function GET({ request }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const rateLimits = await getSessionContext(apiKey);
    return json(rateLimits);
  } catch (error) {
    return json({ error: 'Failed to fetch session context' }, { status: 500 });
  }
}
```

---

### 2. Cost Report API (Historical Usage)

**Endpoint:** `GET /v1/organizations/cost_report`
**Base URL:** `https://api.anthropic.com`
**Refresh Rate:** Aggregated daily (1-hour delay)
**Authentication:** Admin API key (`sk-ant-admin...`)

#### Request Parameters

```typescript
interface CostReportParams {
  starting_at: string; // RFC 3339 timestamp
  ending_at?: string; // RFC 3339 timestamp
  bucket_width?: '1d'; // Currently only supports daily
  group_by?: ('workspace_id' | 'description')[];
  limit?: number; // Max time buckets to return
  page?: string; // Pagination token
}
```

#### Response Format

```typescript
interface CostReport {
  data: TimeBucket[];
  has_more: boolean;
  next_page?: string;
}

interface TimeBucket {
  starting_at: string; // RFC 3339
  ending_at: string; // RFC 3339
  results: CostItem[];
}

interface CostItem {
  amount: string; // Decimal string in USD cents
  currency: 'USD';
  cost_type: 'tokens' | 'web_search' | 'code_execution';
  context_window?: '0-200k' | '200k-1M'; // Token costs only
  token_type?: string; // Input, output, cache types
  model: string; // e.g., 'claude-sonnet-4-5-20250929'
  service_tier: 'standard' | 'batch';
  workspace_id?: string;
  description?: string; // Grouped dimension
}
```

#### Code Example

```typescript
// src/lib/api/cost-report.ts
export async function getCostReport(
  adminApiKey: string,
  params: CostReportParams
): Promise<CostReport> {
  const url = new URL('https://api.anthropic.com/v1/organizations/cost_report');

  url.searchParams.append('starting_at', params.starting_at);
  if (params.ending_at) url.searchParams.append('ending_at', params.ending_at);
  if (params.bucket_width) url.searchParams.append('bucket_width', params.bucket_width);
  if (params.group_by) {
    params.group_by.forEach(g => url.searchParams.append('group_by', g));
  }
  if (params.limit) url.searchParams.append('limit', params.limit.toString());
  if (params.page) url.searchParams.append('page', params.page);

  const response = await fetch(url.toString(), {
    headers: {
      'X-Api-Key': adminApiKey,
      'anthropic-version': '2024-10-01'
    }
  });

  if (!response.ok) {
    throw new Error(`Cost Report API error: ${response.statusText}`);
  }

  return await response.json();
}

// Get last 7 days of usage
export async function getWeeklyUsage(adminApiKey: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const report = await getCostReport(adminApiKey, {
    starting_at: startDate.toISOString(),
    ending_at: endDate.toISOString(),
    bucket_width: '1d',
    group_by: ['workspace_id']
  });

  // Aggregate token usage across all buckets
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;

  for (const bucket of report.data) {
    for (const item of bucket.results) {
      const costUSD = parseFloat(item.amount) / 100; // Convert cents to dollars
      totalCost += costUSD;

      // Approximate token counts from cost (model-dependent)
      // This is rough estimation - actual tokens not provided
      if (item.token_type?.includes('input')) {
        totalInputTokens += Math.round(costUSD / 0.000003 * 1000); // $3/MTok estimate
      } else if (item.token_type?.includes('output')) {
        totalOutputTokens += Math.round(costUSD / 0.000015 * 1000); // $15/MTok estimate
      }
    }
  }

  return {
    totalCost,
    totalInputTokens,
    totalOutputTokens,
    days: report.data.length
  };
}
```

**SvelteKit API Route:**

```typescript
// src/routes/api/usage/weekly/+server.ts
import { json } from '@sveltejs/kit';
import { getWeeklyUsage } from '$lib/api/cost-report';

export async function GET() {
  const adminApiKey = process.env.ANTHROPIC_ADMIN_API_KEY;

  if (!adminApiKey) {
    return json({ error: 'Admin API key not configured' }, { status: 500 });
  }

  try {
    const usage = await getWeeklyUsage(adminApiKey);
    return json(usage);
  } catch (error) {
    return json({ error: 'Failed to fetch weekly usage' }, { status: 500 });
  }
}
```

---

### 3. Claude Code Analytics API (Developer Metrics)

**Endpoint:** `GET /v1/organizations/usage_report/claude_code`
**Base URL:** `https://api.anthropic.com`
**Refresh Rate:** Daily aggregation (1-hour delay)
**Authentication:** Admin API key (`sk-ant-admin...`)

#### Available Metrics

- **Usage:** Sessions, commits, pull requests
- **Productivity:** Lines added/removed
- **Tool acceptance:** Edit/Write/NotebookEdit accept/reject counts
- **Costs:** Token usage and estimated costs per model
- **Dimensions:** Date, actor (user), organization, terminal type

#### Request Parameters

```typescript
interface ClaudeCodeParams {
  starting_at: string; // UTC date YYYY-MM-DD (single-day metrics)
  limit?: number; // Records per page (default: 20, max: 1000)
  page?: string; // Pagination cursor
}
```

#### Response Format

```typescript
interface ClaudeCodeReport {
  data: ClaudeCodeRecord[];
  has_more: boolean;
  next_page?: string;
}

interface ClaudeCodeRecord {
  date: string; // YYYY-MM-DD
  actor: string; // User ID or "API"
  organization_id: string;
  customer_type: string;
  terminal_type: string;
  sessions: number;
  lines_added: number;
  lines_removed: number;
  commits: number;
  pull_requests: number;
  edit_tool_accepted: number;
  edit_tool_rejected: number;
  write_tool_accepted: number;
  write_tool_rejected: number;
  notebook_edit_tool_accepted: number;
  notebook_edit_tool_rejected: number;
  model_usage: ModelUsage[]; // Per-model breakdown
}

interface ModelUsage {
  model: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: string; // Decimal string
}
```

#### Code Example

```typescript
// src/lib/api/claude-code-analytics.ts
export async function getClaudeCodeMetrics(
  adminApiKey: string,
  date: string // YYYY-MM-DD
): Promise<ClaudeCodeReport> {
  const url = new URL('https://api.anthropic.com/v1/organizations/usage_report/claude_code');
  url.searchParams.append('starting_at', date);
  url.searchParams.append('limit', '1000'); // Get all records for the day

  const response = await fetch(url.toString(), {
    headers: {
      'X-Api-Key': adminApiKey,
      'anthropic-version': '2024-10-01'
    }
  });

  if (!response.ok) {
    throw new Error(`Claude Code Analytics API error: ${response.statusText}`);
  }

  return await response.json();
}

// Aggregate metrics for last 30 days
export async function getMonthlyDeveloperMetrics(adminApiKey: string) {
  const metrics = {
    totalSessions: 0,
    totalCommits: 0,
    totalPullRequests: 0,
    totalLinesAdded: 0,
    totalLinesRemoved: 0,
    toolAcceptanceRate: 0,
    totalCost: 0
  };

  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    try {
      const report = await getClaudeCodeMetrics(adminApiKey, dateStr);

      for (const record of report.data) {
        metrics.totalSessions += record.sessions;
        metrics.totalCommits += record.commits;
        metrics.totalPullRequests += record.pull_requests;
        metrics.totalLinesAdded += record.lines_added;
        metrics.totalLinesRemoved += record.lines_removed;

        // Calculate acceptance rate
        const totalActions = record.edit_tool_accepted + record.edit_tool_rejected +
                            record.write_tool_accepted + record.write_tool_rejected +
                            record.notebook_edit_tool_accepted + record.notebook_edit_tool_rejected;
        const acceptedActions = record.edit_tool_accepted + record.write_tool_accepted +
                               record.notebook_edit_tool_accepted;

        if (totalActions > 0) {
          metrics.toolAcceptanceRate += acceptedActions / totalActions;
        }

        // Sum costs
        for (const modelUsage of record.model_usage) {
          metrics.totalCost += parseFloat(modelUsage.estimated_cost_usd);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch metrics for ${dateStr}:`, error);
    }
  }

  // Average acceptance rate
  metrics.toolAcceptanceRate = metrics.toolAcceptanceRate / 30;

  return metrics;
}
```

---

## Data Format Summary

### Session Context (Real-Time)

```typescript
interface SessionContext {
  // Per-minute quotas
  requestsRemaining: number; // e.g., 45 out of 50
  inputTokensRemaining: number; // e.g., 18000 out of 20000
  outputTokensRemaining: number; // e.g., 3500 out of 4000

  // Reset times
  requestsResetAt: Date; // When limits reset
  inputTokensResetAt: Date;

  // ⚠️  LIMITATION: No weekly/daily total quota provided
  // Only per-minute rate limits
}
```

### Weekly Quota (Historical)

```typescript
interface WeeklyUsage {
  totalCost: number; // USD
  totalInputTokens: number; // Estimated from cost
  totalOutputTokens: number; // Estimated from cost
  dailyBreakdown: DailyUsage[];
}

interface DailyUsage {
  date: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  models: { [model: string]: ModelUsage };
}
```

### Token Consumption Rates

```typescript
interface TokenConsumption {
  // Current session (real-time)
  perMinuteRate: {
    input: number; // Tokens/minute being consumed
    output: number;
  };

  // Historical (daily aggregated)
  averageDailyTokens: number;
  peakDailyTokens: number;
  costPerDay: number;

  // Developer productivity
  tokensPerCommit: number;
  tokensPerSession: number;
}
```

---

## Limitations & Gaps

### ❌ NOT Available

1. **Weekly Quota Total**: API does not expose organization-wide weekly token limits
2. **Real-Time Session Context Remaining**: Per-minute limits only, no daily/weekly totals in headers
3. **Token Count from Cost**: Cost Report provides USD amounts, not exact token counts
4. **Local State Files**: Claude Code does not store usage metrics in config files
5. **CLI Commands**: No `claude usage` or `claude quota` commands available

### ✅ Workarounds

1. **Estimate Weekly Usage**: Sum Cost Report for last 7 days, estimate tokens from cost
2. **Track Session Context**: Monitor rate limit headers on each API call
3. **Dashboard Polling**: Fetch Cost Report API daily, cache results
4. **Local Calculation**: Track tokens client-side (input + output from API responses)

---

## Recommended Implementation

### Dashboard Display Components

**1. Real-Time Session Context Card**

```svelte
<!-- src/lib/components/SessionContextCard.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  let sessionContext = $state(null);
  let loading = $state(true);

  async function fetchSessionContext() {
    const res = await fetch('/api/usage/session');
    sessionContext = await res.json();
    loading = false;
  }

  onMount(() => {
    fetchSessionContext();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSessionContext, 30000);
    return () => clearInterval(interval);
  });
</script>

{#if loading}
  <div class="card">Loading...</div>
{:else}
  <div class="card">
    <h3>Session Context</h3>
    <div class="stat">
      <div class="stat-title">Requests Remaining</div>
      <div class="stat-value">{sessionContext.requestsRemaining}/{sessionContext.requestsLimit}</div>
      <div class="stat-desc">Resets at {new Date(sessionContext.requestsReset).toLocaleTimeString()}</div>
    </div>
    <div class="stat">
      <div class="stat-title">Input Tokens Remaining</div>
      <div class="stat-value">{sessionContext.inputTokensRemaining.toLocaleString()}</div>
    </div>
    <div class="stat">
      <div class="stat-title">Output Tokens Remaining</div>
      <div class="stat-value">{sessionContext.outputTokensRemaining.toLocaleString()}</div>
    </div>
  </div>
{/if}
```

**2. Weekly Usage Chart**

```svelte
<!-- src/lib/components/WeeklyUsageChart.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  let weeklyData = $state(null);

  onMount(async () => {
    const res = await fetch('/api/usage/weekly');
    weeklyData = await res.json();
  });
</script>

{#if weeklyData}
  <div class="card">
    <h3>Last 7 Days</h3>
    <div class="stats">
      <div class="stat">
        <div class="stat-title">Total Cost</div>
        <div class="stat-value">${weeklyData.totalCost.toFixed(2)}</div>
      </div>
      <div class="stat">
        <div class="stat-title">Total Tokens</div>
        <div class="stat-value">{(weeklyData.totalInputTokens + weeklyData.totalOutputTokens).toLocaleString()}</div>
      </div>
    </div>
  </div>
{/if}
```

---

## Environment Variables

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-api...           # Standard API key (for rate limits)
ANTHROPIC_ADMIN_API_KEY=sk-ant-admin...   # Admin API key (for cost/analytics)
```

---

## Conclusion

### Key Findings

1. **Real-Time Metrics**: Available via rate limit headers (per-minute quotas)
2. **Historical Metrics**: Available via Cost Report API (daily aggregated)
3. **Developer Metrics**: Available via Claude Code Analytics API (daily aggregated)
4. **Refresh Rate**: Headers (instant), APIs (1-hour delay)
5. **Authentication**: Standard key for headers, Admin key for APIs

### Implementation Recommendation

**For Dashboard:**
- Use `/api/usage/session` endpoint to display real-time per-minute rate limits
- Use `/api/usage/weekly` endpoint to show 7-day cost/token totals
- Poll session context every 30 seconds for live updates
- Fetch weekly data once per hour (cache results)

**Limitations to Communicate:**
- No weekly quota total exposed by API (only per-minute limits)
- Token counts must be estimated from cost data (not exact)
- 1-hour delay for historical data
- Admin API key required for cost/analytics access

### Next Steps

1. Implement SvelteKit API routes (`/api/usage/session`, `/api/usage/weekly`)
2. Create dashboard components for display
3. Add environment variable configuration for Admin API key
4. Implement client-side caching for API responses
5. Add error handling for rate limit exceeded scenarios
