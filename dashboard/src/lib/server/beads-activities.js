/**
 * Beads Activity Utilities
 *
 * Provides utilities to fetch agent task history from Beads for display in AgentCard.
 * Returns activities in a format compatible with the existing AgentCard activity timeline.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Get agent activities from Beads task database
 *
 * @param {string} agentName - Name of the agent
 * @returns {Promise<Array>} Array of activity objects compatible with AgentCard
 *
 * @example
 * const activities = await getAgentActivitiesFromBeads('WildStream');
 * // Returns:
 * // [
 * //   {
 * //     ts: '2025-11-22T08:15:00.000Z',
 * //     preview: '[jat-abc] Implement feature X',
 * //     content: 'Full task description...',
 * //     type: 'task',
 * //     taskId: 'jat-abc'
 * //   }
 * // ]
 */
export async function getAgentActivitiesFromBeads(agentName) {
	if (!agentName) {
		throw new Error('Agent name is required');
	}

	try {
		// Query Beads for tasks assigned to this agent
		const { stdout, stderr } = await execAsync(
			`bd list --json --assignee "${agentName.replace(/"/g, '\\"')}"`,
			{ maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for large task lists
		);

		if (stderr && !stdout) {
			console.error(`Beads query error for ${agentName}:`, stderr);
			return [];
		}

		if (!stdout.trim()) {
			// No tasks found for this agent
			return [];
		}

		// Parse Beads JSON output
		const tasks = JSON.parse(stdout);

		if (!Array.isArray(tasks)) {
			console.error(`Unexpected Beads output format for ${agentName}:`, tasks);
			return [];
		}

		// Transform Beads tasks to activity format
		const activities = tasks.map(task => ({
			// Use most recent timestamp (updated_at or closed_at)
			ts: task.closed_at || task.updated_at || task.created_at,

			// Format: [task-id] Task title
			preview: `[${task.id}] ${task.title}`,

			// Full task description (optional, for detail view)
			content: task.description || task.title,

			// Activity type
			type: 'task',

			// Task ID for click handling
			taskId: task.id
		}));

		// Sort by most recent first
		activities.sort((a, b) => new Date(b.ts) - new Date(a.ts));

		// Limit to last 10 tasks
		return activities.slice(0, 10);

	} catch (error) {
		console.error(`Failed to fetch Beads activities for ${agentName}:`, error.message);
		return [];
	}
}
