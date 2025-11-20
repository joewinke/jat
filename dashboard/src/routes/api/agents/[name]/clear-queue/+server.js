/**
 * Agent Clear Queue API - Unassign All Tasks from Agent
 * POST /api/agents/[name]/clear-queue
 *
 * Unassigns all open tasks from the agent using bd update
 */

import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getProjectPath } from '$lib/utils/projectUtils.js';
import { getTasks } from '$lib/server/beads.js';

const execAsync = promisify(exec);

/** @type {import('./$types').RequestHandler} */
export async function POST({ params }) {
	try {
		const agentName = params.name;

		if (!agentName) {
			return json({
				error: 'Missing agent name',
				message: 'Agent name is required'
			}, { status: 400 });
		}

		// Get all tasks from all projects and filter to this agent's open tasks
		try {
			const allTasks = getTasks({ status: 'open' });

			// Filter to tasks assigned to this agent
			const agentTasks = allTasks.filter(
				(t) => t.assignee === agentName
			);

			if (agentTasks.length === 0) {
				return json({
					success: true,
					agentName,
					message: 'No open tasks to clear',
					clearedCount: 0,
					timestamp: new Date().toISOString()
				});
			}

			// Unassign each task using its project-specific path
			const updatePromises = agentTasks.map((task) => {
				const projectPath = getProjectPath(task.id);
				if (!projectPath) {
					throw new Error(`Could not determine project path for task ${task.id}`);
				}
				return execAsync(`bd update ${task.id} --assignee ""`, { cwd: projectPath });
			});

			await Promise.all(updatePromises);

			return json({
				success: true,
				agentName,
				message: `Cleared ${agentTasks.length} tasks from ${agentName}'s queue`,
				clearedCount: agentTasks.length,
				clearedTasks: agentTasks.map((t) => t.id),
				timestamp: new Date().toISOString()
			});
		} catch (execError) {
			console.error('clear-queue error:', execError);

			return json({
				error: 'Failed to clear queue',
				message: execError.stderr || execError.message,
				agentName
			}, { status: 500 });
		}
	} catch (error) {
		console.error('Error in POST /api/agents/[name]/clear-queue:', error);
		return json({
			error: 'Internal server error',
			message: error.message
		}, { status: 500 });
	}
}
