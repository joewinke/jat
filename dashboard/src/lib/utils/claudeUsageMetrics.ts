/**
 * Claude API Usage Metrics Utility
 *
 * Provides data fetching for Claude API usage metrics to replace hour-based capacity estimation.
 * Based on research documented in dashboard/docs/claude-api-usage-research.md
 *
 * Features:
 * - Subscription tier detection from ~/.claude/.credentials.json
 * - Real-time session context (per-minute rate limits from API headers)
 * - Caching layer to prevent API hammering
 * - Graceful error handling with fallbacks
 *
 * Task: jat-sk1 - Implement Claude API usage data fetching
 * Author: FaintRidge
 * Date: 2025-11-21
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Claude subscription tiers with associated rate limits
 */
export type SubscriptionTier = 'free' | 'build' | 'max';

/**
 * Rate limit thresholds by subscription tier
 */
export interface RateLimitTier {
  tokensPerMin: number;
  tokensPerDay: number;
  requestsPerMin: number;
  requestsPerDay: number;
}

/**
 * Claude OAuth credentials structure (from ~/.claude/.credentials.json)
 */
export interface ClaudeCredentials {
  claudeAiOauth: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number; // Unix timestamp
    scopes: string[];
    subscriptionType: SubscriptionTier;
    rateLimitTier: string; // e.g., "default_claude_max_20x"
  };
}

/**
 * Real-time session context from API rate limit headers
 */
export interface SessionContext {
  // Per-minute quotas
  requestsLimit: number;
  requestsRemaining: number;
  requestsResetAt: Date;

  inputTokensLimit: number;
  inputTokensRemaining: number;
  inputTokensResetAt: Date;

  outputTokensRemaining: number;

  // Metadata
  tier: SubscriptionTier;
  fetchedAt: Date;
}

/**
 * Agent activity metrics (for load calculation)
 */
export interface AgentMetrics {
  totalAgents: number;
  workingAgents: number;
  idleAgents: number;
  sleepingAgents: number;
  loadPercentage: number; // (workingAgents / totalAgents) * 100
}

/**
 * Token burn rate estimation
 */
export interface TokenBurnRate {
  tokensPerHour: number;
  tokensPerSession: number; // 5-hour sessions
  hoursRemaining: number; // Based on current burn rate
}

/**
 * Comprehensive Claude usage metrics for dashboard display
 */
export interface ClaudeUsageMetrics {
  // Subscription info
  tier: SubscriptionTier;
  tierLimits: RateLimitTier;

  // Session context (real-time from API)
  sessionContext: SessionContext | null;

  // Agent activity
  agentMetrics: AgentMetrics | null;

  // Token burn rate
  burnRate: TokenBurnRate | null;

  // Metadata
  lastUpdated: Date;
  cacheHit: boolean;
  errors: string[]; // Non-fatal errors (graceful degradation)
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Rate limit thresholds by subscription tier
 * Source: https://docs.anthropic.com/en/api/rate-limits
 */
const TIER_LIMITS: Record<SubscriptionTier, RateLimitTier> = {
  free: {
    tokensPerMin: 50_000,
    tokensPerDay: 150_000,
    requestsPerMin: 50,
    requestsPerDay: 100
  },
  build: {
    tokensPerMin: 200_000,
    tokensPerDay: 600_000,
    requestsPerMin: 100,
    requestsPerDay: 2_000
  },
  max: {
    tokensPerMin: 2_000_000,
    tokensPerDay: 10_000_000,
    requestsPerMin: 2_000,
    requestsPerDay: 10_000
  }
};

/**
 * Cache duration in milliseconds
 * - Session context: 30 seconds (real-time updates)
 * - Agent metrics: 60 seconds (reasonable freshness)
 */
const CACHE_DURATION_MS = {
  sessionContext: 30_000, // 30 seconds
  agentMetrics: 60_000 // 60 seconds
};

// ============================================================================
// Cache Layer
// ============================================================================

/**
 * Simple in-memory cache for API responses
 */
class MetricsCache {
  private sessionContextCache: { data: SessionContext; expiresAt: number } | null = null;
  private agentMetricsCache: { data: AgentMetrics; expiresAt: number } | null = null;

  getSessionContext(): SessionContext | null {
    if (!this.sessionContextCache) return null;

    const now = Date.now();
    if (now > this.sessionContextCache.expiresAt) {
      this.sessionContextCache = null;
      return null;
    }

    return this.sessionContextCache.data;
  }

  setSessionContext(data: SessionContext): void {
    this.sessionContextCache = {
      data,
      expiresAt: Date.now() + CACHE_DURATION_MS.sessionContext
    };
  }

  getAgentMetrics(): AgentMetrics | null {
    if (!this.agentMetricsCache) return null;

    const now = Date.now();
    if (now > this.agentMetricsCache.expiresAt) {
      this.agentMetricsCache = null;
      return null;
    }

    return this.agentMetricsCache.data;
  }

  setAgentMetrics(data: AgentMetrics): void {
    this.agentMetricsCache = {
      data,
      expiresAt: Date.now() + CACHE_DURATION_MS.agentMetrics
    };
  }

  clear(): void {
    this.sessionContextCache = null;
    this.agentMetricsCache = null;
  }
}

// Singleton cache instance
const cache = new MetricsCache();

// ============================================================================
// Subscription Tier Detection
// ============================================================================

/**
 * Read subscription tier from Claude OAuth credentials file
 *
 * @returns Subscription tier or 'free' as fallback
 */
export function getSubscriptionTier(): SubscriptionTier {
  try {
    const credPath = path.join(os.homedir(), '.claude/.credentials.json');

    if (!fs.existsSync(credPath)) {
      console.warn('Claude credentials not found at:', credPath);
      return 'free'; // Fallback
    }

    const credentialsRaw = fs.readFileSync(credPath, 'utf-8');
    const credentials: ClaudeCredentials = JSON.parse(credentialsRaw);

    const tier = credentials.claudeAiOauth.subscriptionType;

    // Validate tier
    if (!['free', 'build', 'max'].includes(tier)) {
      console.warn('Unknown subscription tier:', tier);
      return 'free';
    }

    return tier as SubscriptionTier;
  } catch (error) {
    console.error('Error reading subscription tier:', error);
    return 'free'; // Fallback
  }
}

/**
 * Get rate limit thresholds for current subscription tier
 */
export function getRateLimitTier(): RateLimitTier {
  const tier = getSubscriptionTier();
  return TIER_LIMITS[tier];
}

// ============================================================================
// Session Context Fetching (Placeholder)
// ============================================================================

/**
 * Fetch real-time session context from Claude API rate limit headers
 *
 * IMPORTANT: This requires making an API call to Anthropic.
 * For now, this is a placeholder that returns null.
 *
 * Full implementation requires:
 * 1. Install @anthropic-ai/sdk
 * 2. Read OAuth token from ~/.claude/.credentials.json
 * 3. Make minimal API call to extract headers
 * 4. Parse rate limit headers
 *
 * See: dashboard/docs/claude-api-usage-research.md (Section 1)
 *
 * @returns SessionContext or null if unavailable
 */
export async function fetchSessionContext(): Promise<SessionContext | null> {
  // Check cache first
  const cached = cache.getSessionContext();
  if (cached) {
    return cached;
  }

  try {
    // NOTE: Session context requires an Anthropic API key (sk-ant-api03-...),
    // not the OAuth token from Claude.ai (sk-ant-oat01-...).
    //
    // Most users won't have a separate API key, so this will gracefully return null.
    // To enable this feature:
    // 1. Get an API key from https://console.anthropic.com/
    // 2. Set ANTHROPIC_API_KEY environment variable

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // No API key configured - this is expected for most users
      return null;
    }

    // Make direct HTTP request to get response headers
    // The Anthropic SDK doesn't expose HTTP headers, so we use fetch
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }]
      })
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, response.statusText);
      return null;
    }

    // Extract rate limit headers from HTTP response
    const headers = response.headers;

    // Parse headers into SessionContext
    const sessionContext: SessionContext = {
      requestsLimit: parseInt(headers.get('anthropic-ratelimit-requests-limit') || '0'),
      requestsRemaining: parseInt(headers.get('anthropic-ratelimit-requests-remaining') || '0'),
      requestsResetAt: new Date(headers.get('anthropic-ratelimit-requests-reset') || Date.now() + 60000),

      inputTokensLimit: parseInt(headers.get('anthropic-ratelimit-input-tokens-limit') || '0'),
      inputTokensRemaining: parseInt(headers.get('anthropic-ratelimit-input-tokens-remaining') || '0'),
      inputTokensResetAt: new Date(headers.get('anthropic-ratelimit-input-tokens-reset') || Date.now() + 60000),

      outputTokensRemaining: parseInt(headers.get('anthropic-ratelimit-output-tokens-remaining') || '0'),

      tier: getSubscriptionTier(),
      fetchedAt: new Date()
    };

    // Cache for 30 seconds
    cache.setSessionContext(sessionContext);
    return sessionContext;
  } catch (error) {
    console.error('Error fetching session context:', error);
    return null; // Graceful degradation
  }
}

// ============================================================================
// Agent Metrics (Placeholder)
// ============================================================================

/**
 * Get agent activity metrics from Agent Mail
 *
 * IMPORTANT: This requires executing shell commands (am-agents).
 * For server-side use only (not browser).
 *
 * @returns AgentMetrics or null if unavailable
 */
export async function fetchAgentMetrics(): Promise<AgentMetrics | null> {
  // Check cache first
  const cached = cache.getAgentMetrics();
  if (cached) {
    return cached;
  }

  try {
    // Execute am-agents command to get agent status
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync('am-agents --json');
    const agents = JSON.parse(stdout);

    // Calculate agent status counts
    const working = agents.filter((a: any) => {
      const lastActivity = new Date(a.last_activity_ts);
      const minutesSinceActivity = (Date.now() - lastActivity.getTime()) / 60000;
      // Consider "working" if active within last 10 minutes
      return minutesSinceActivity < 10;
    }).length;

    const idle = agents.filter((a: any) => {
      const lastActivity = new Date(a.last_activity_ts);
      const minutesSinceActivity = (Date.now() - lastActivity.getTime()) / 60000;
      // Consider "idle" if active between 10 min and 1 hour ago
      return minutesSinceActivity >= 10 && minutesSinceActivity < 60;
    }).length;

    const sleeping = agents.filter((a: any) => {
      const lastActivity = new Date(a.last_activity_ts);
      const minutesSinceActivity = (Date.now() - lastActivity.getTime()) / 60000;
      // Consider "sleeping" if inactive for over 1 hour
      return minutesSinceActivity >= 60;
    }).length;

    const metrics: AgentMetrics = {
      totalAgents: agents.length,
      workingAgents: working,
      idleAgents: idle,
      sleepingAgents: sleeping,
      loadPercentage: agents.length > 0 ? Math.round((working / agents.length) * 100) : 0
    };

    // Cache for 60 seconds
    cache.setAgentMetrics(metrics);
    return metrics;
  } catch (error) {
    console.error('Error fetching agent metrics:', error);
    return null; // Graceful degradation
  }
}

// ============================================================================
// Token Burn Rate (Placeholder)
// ============================================================================

/**
 * Estimate token burn rate based on API usage samples
 *
 * IMPORTANT: This requires tracking API calls over time.
 * For now, returns null (not yet implemented).
 *
 * @returns TokenBurnRate or null if unavailable
 */
export async function estimateTokenBurnRate(): Promise<TokenBurnRate | null> {
  // TODO (future): Implement token burn rate tracking
  // This requires:
  // 1. Store API call samples (timestamp, tokens remaining)
  // 2. Calculate delta over time
  // 3. Estimate tokens/hour and hours remaining
  //
  // For now, return null

  console.warn('estimateTokenBurnRate() not yet implemented - returning null');
  return null;
}

// ============================================================================
// Main API - Get All Metrics
// ============================================================================

/**
 * Get comprehensive Claude usage metrics for dashboard display
 *
 * This is the main API that components should use.
 * Fetches all metrics with graceful degradation (null for unavailable data).
 *
 * @returns ClaudeUsageMetrics object with all available metrics
 */
export async function getClaudeUsageMetrics(): Promise<ClaudeUsageMetrics> {
  const errors: string[] = [];

  // Fetch tier info (always available from local file)
  const tier = getSubscriptionTier();
  const tierLimits = TIER_LIMITS[tier];

  // Fetch session context (may be null)
  let sessionContext: SessionContext | null = null;
  try {
    sessionContext = await fetchSessionContext();
  } catch (error) {
    errors.push(`Session context unavailable: ${error}`);
  }

  // Fetch agent metrics (may be null)
  let agentMetrics: AgentMetrics | null = null;
  try {
    agentMetrics = await fetchAgentMetrics();
  } catch (error) {
    errors.push(`Agent metrics unavailable: ${error}`);
  }

  // Estimate burn rate (may be null)
  let burnRate: TokenBurnRate | null = null;
  try {
    burnRate = await estimateTokenBurnRate();
  } catch (error) {
    errors.push(`Burn rate estimation unavailable: ${error}`);
  }

  return {
    tier,
    tierLimits,
    sessionContext,
    agentMetrics,
    burnRate,
    lastUpdated: new Date(),
    cacheHit: !!sessionContext || !!agentMetrics, // True if ANY data came from cache
    errors
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Clear the metrics cache (useful for testing or forced refresh)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Format large numbers with commas for display
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Calculate percentage with safe division
 */
export function calculatePercentage(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
}

/**
 * Format time remaining (e.g., "2h 15m")
 */
export function formatTimeRemaining(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }

  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
