/**
 * Token Usage Display Configuration
 *
 * Adjust these thresholds based on your team's budget and usage patterns.
 * Color coding helps identify usage levels at a glance.
 *
 * Pricing Reference (Claude Sonnet 4.5):
 * - Input: $3.00 per million tokens
 * - Cache creation: $3.75 per million tokens
 * - Cache read: $0.30 per million tokens
 * - Output: $15.00 per million tokens
 *
 * Approximate daily costs (assuming typical cache hit rates):
 * - 100K tokens/day ≈ $0.30/day ≈ $9/month
 * - 500K tokens/day ≈ $1.50/day ≈ $45/month
 * - 1M tokens/day ≈ $3.00/day ≈ $90/month
 * - 5M tokens/day ≈ $15/day ≈ $450/month
 */

export const TOKEN_THRESHOLDS = {
	/**
	 * Green zone: Normal usage
	 * < 100K tokens/day (~$0.30/day, ~$9/month)
	 */
	low: 100_000_000,

	/**
	 * Yellow zone: Elevated usage, monitor
	 * 100K-500K tokens/day (~$1.50/day, ~$45/month)
	 */
	medium: 250_000_000,

	/**
	 * Orange zone: High usage, investigate
	 * 500K-1M tokens/day (~$3/day, ~$90/month)
	 */
	high: 500_000_000

	/**
	 * Red zone: Critical usage, take action
	 * Anything above 'high' threshold (>1M tokens/day)
	 */
};

/**
 * Show warning badge when daily usage exceeds this threshold
 * Default: 1M tokens/day (red zone)
 */
export const HIGH_USAGE_WARNING_THRESHOLD = TOKEN_THRESHOLDS.high;

/**
 * Helper function to get color class based on token count and thresholds
 */
export function getTokenColorClass(tokens: number): string {
	if (tokens === 0) return 'text-base-content/50';
	if (tokens < TOKEN_THRESHOLDS.low) return 'text-success';
	if (tokens < TOKEN_THRESHOLDS.medium) return 'text-warning';
	if (tokens < TOKEN_THRESHOLDS.high) return 'text-orange-500';
	return 'text-error';
}
