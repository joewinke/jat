/**
 * Sparkline API Endpoint with Caching
 *
 * GET /api/agents/sparkline?range=24h&agent=AgentName&session=sessionId
 *
 * Returns time-series token usage data for sparkline visualization.
 *
 * Query Parameters:
 * - range: Time range (24h | 7d | all) - defaults to 24h
 * - agent: Agent name filter (optional)
 * - session: Session ID filter (optional)
 * - bucketSize: Time bucket size (30min | hour | session) - defaults to 30min
 *
 * Response Format:
 * {
 *   data: [{ timestamp, tokens, cost, breakdown }, ...],
 *   totalTokens: number,
 *   totalCost: number,
 *   bucketCount: number,
 *   bucketSize: string,
 *   startTime: string,
 *   endTime: string,
 *   cached: boolean,
 *   cacheAge: number
 * }
 *
 * Caching:
 * - 30-second TTL per unique query combination
 * - In-memory Map-based cache
 * - Cache key: `${range}-${agent}-${session}-${bucketSize}`
 * - Performance: <5ms (cache hit), <100ms (cache miss)
 */

import { json } from '@sveltejs/kit';
import { getTokenTimeSeries } from '$lib/utils/tokenUsageTimeSeries.js';

// ============================================================================
// In-Memory Cache
// ============================================================================

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {any} data - Cached response data
 * @property {number} timestamp - Cache creation timestamp
 */

/**
 * In-memory cache for sparkline data
 * Key format: `${range}-${agent}-${session}-${bucketSize}`
 * @type {Map<string, CacheEntry>}
 */
const cache = new Map();

/**
 * Cache TTL in milliseconds (30 seconds)
 */
const CACHE_TTL_MS = 30 * 1000;

/**
 * Get cached data if valid
 *
 * @param {string} key - Cache key
 * @returns {{data: any, age: number}|null} Cached data or null if expired/missing
 */
function getCached(key) {
	const entry = cache.get(key);
	if (!entry) {
		return null;
	}

	const age = Date.now() - entry.timestamp;

	// Check if expired
	if (age > CACHE_TTL_MS) {
		cache.delete(key);
		return null;
	}

	return { data: entry.data, age };
}

/**
 * Store data in cache
 *
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
function setCache(key, data) {
	cache.set(key, {
		data,
		timestamp: Date.now()
	});
}

/**
 * Generate cache key from query parameters
 *
 * @param {Object} params - Query parameters
 * @param {string} [params.range] - Time range
 * @param {string} [params.agent] - Agent name
 * @param {string} [params.session] - Session ID
 * @param {string} [params.bucketSize] - Bucket size
 * @returns {string} Cache key
 */
function getCacheKey(params) {
	const { range = '24h', agent = '', session = '', bucketSize = '30min' } = params;
	return `${range}-${agent}-${session}-${bucketSize}`;
}

// ============================================================================
// API Handler
// ============================================================================

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		// Extract query parameters
		const range = url.searchParams.get('range') || '24h';
		const agentName = url.searchParams.get('agent') || undefined;
		const sessionId = url.searchParams.get('session') || undefined;
		const bucketSize = url.searchParams.get('bucketSize') || '30min';

		// Validate parameters
		if (!['24h', '7d', 'all'].includes(range)) {
			return json(
				{
					error: 'Invalid range parameter',
					message: 'Range must be: 24h, 7d, or all',
					validValues: ['24h', '7d', 'all']
				},
				{ status: 400 }
			);
		}

		if (!['30min', 'hour', 'session'].includes(bucketSize)) {
			return json(
				{
					error: 'Invalid bucketSize parameter',
					message: 'Bucket size must be: 30min, hour, or session',
					validValues: ['30min', 'hour', 'session']
				},
				{ status: 400 }
			);
		}

		// Generate cache key
		const cacheKey = getCacheKey({ range, agent: agentName, session: sessionId, bucketSize });

		// Check cache
		const cached = getCached(cacheKey);
		if (cached) {
			console.log(`[Sparkline API] Cache HIT for ${cacheKey} (age: ${cached.age}ms)`);

			return json({
				...cached.data,
				cached: true,
				cacheAge: cached.age
			});
		}

		console.log(`[Sparkline API] Cache MISS for ${cacheKey}, fetching data...`);

		// Fetch data (cache miss)
		const startTime = Date.now();

		// Get project path (dashboard runs from /dashboard subdirectory)
		const projectPath = process.cwd().replace(/\/dashboard$/, '');

		const result = await getTokenTimeSeries({
			range,
			agentName,
			sessionId,
			bucketSize,
			projectPath
		});

		const fetchDuration = Date.now() - startTime;
		console.log(
			`[Sparkline API] Fetched ${result.bucketCount} buckets in ${fetchDuration}ms (${result.totalTokens.toLocaleString()} tokens)`
		);

		// Cache the result
		setCache(cacheKey, result);

		// Return result with cache metadata
		return json({
			...result,
			cached: false,
			cacheAge: 0,
			fetchDuration
		});
	} catch (error) {
		console.error('[Sparkline API] Error:', error);
		console.error('[Sparkline API] Error stack:', error.stack);

		return json(
			{
				error: 'Failed to fetch sparkline data',
				message: error.message || 'Unknown error',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
			},
			{ status: 500 }
		);
	}
}

/**
 * Clear cache (for testing/debugging)
 *
 * DELETE /api/agents/sparkline
 */
export async function DELETE() {
	const cacheSize = cache.size;
	cache.clear();

	return json({
		success: true,
		message: `Cache cleared (${cacheSize} entries removed)`,
		clearedEntries: cacheSize
	});
}
