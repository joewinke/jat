/**
 * Activity Status Configuration
 *
 * Defines visual indicators (icons, colors) for different task statuses
 * in the agent activity feed.
 */

export interface ActivityStatusConfig {
	icon: string;           // SVG path data or emoji
	iconType: 'svg' | 'emoji';  // Icon rendering type
	iconStyle?: 'outline' | 'solid';  // SVG rendering style (default: outline)
	color: string;          // Tailwind color class
	bgColor: string;        // Background color class for badge
	label: string;          // Short status label
	description: string;    // Tooltip description
}

/**
 * Status configuration map
 * Maps Beads task status to visual representation
 */
export const activityStatusConfig: Record<string, ActivityStatusConfig> = {
	// In Progress - Agent actively working
	in_progress: {
		icon: 'M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM14.25 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
		iconType: 'svg',
		iconStyle: 'solid',
		color: 'text-info',
		bgColor: 'bg-info/10',
		label: 'Working',
		description: 'Currently in progress'
	},

	// Completed - Task finished
	closed: {
		icon: '✓',
		iconType: 'emoji',
		color: 'text-success',
		bgColor: 'bg-success/10',
		label: 'Done',
		description: 'Completed successfully'
	},

	// Blocked - Waiting on dependencies
	blocked: {
		icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
		iconType: 'svg',
		color: 'text-warning',
		bgColor: 'bg-warning/10',
		label: 'Blocked',
		description: 'Blocked by dependencies'
	},

	// Open - Ready to start
	open: {
		icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
		iconType: 'svg',
		color: 'text-base-content/50',
		bgColor: 'bg-base-200',
		label: 'Queued',
		description: 'Ready to start'
	}
};

/**
 * Get status config with fallback for unknown statuses
 */
export function getActivityStatusConfig(status: string): ActivityStatusConfig {
	return activityStatusConfig[status] || {
		icon: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z',
		iconType: 'svg',
		color: 'text-base-content/50',
		bgColor: 'bg-base-200',
		label: 'Unknown',
		description: 'Unknown status'
	};
}

/**
 * Extract task status from activity preview text
 * Preview format: "[task-id] Status: Task title"
 */
export function extractStatusFromPreview(preview: string): string | null {
	// Match patterns like "Working:", "Completed:", "Blocked:", "Starting:"
	const match = preview.match(/\]\s+(Working|Completed|Blocked|Starting):/i);
	if (!match) return null;

	// Map preview status text to Beads status
	const statusMap: Record<string, string> = {
		'Working': 'in_progress',
		'Completed': 'closed',
		'Blocked': 'blocked',
		'Starting': 'open'
	};

	return statusMap[match[1]] || null;
}
