/**
 * Agent Unassign Task API - Unassign Specific Task from Agent
 * POST /api/agents/[name]/unassign-task
 *
 * Unassigns a specific task from the agent using bd update
 */

import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getProjectPath } from '$lib/utils/projectUtils.js';

const execAsync = promisify(exec);

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request }) {
	try {
		const agentName = params.name;
		const { taskId } = await request.json();

		if (!agentName || !taskId) {
			return json({
				error: 'Missing required fields',
				message: 'Agent name and task ID are required'
			}, { status: 400 });
		}

		// Determine project path from task ID
		const projectPath = getProjectPath(taskId);
		if (!projectPath) {
			return json({
				error: 'Invalid task ID',
				message: `Could not determine project for task ${taskId}`,
				taskId
			}, { status: 400 });
		}

		// Verify task exists and is assigned to this agent
		const showCommand = `bd show ${taskId} --json`;

		try {
			const { stdout } = await execAsync(showCommand, { cwd: projectPath });
			const task = JSON.parse(stdout.trim());

			if (task.assignee !== agentName) {
				return json({
					error: 'Task not assigned to agent',
					message: `Task ${taskId} is not assigned to ${agentName}`,
					agentName,
					taskId
				}, { status: 400 });
			}

			// Unassign the task
			const updateCommand = `bd update ${taskId} --assignee ""`;
			await execAsync(updateCommand, { cwd: projectPath });

			return json({
				success: true,
				agentName,
				taskId,
				message: `Task ${taskId} unassigned from ${agentName}`,
				timestamp: new Date().toISOString()
			});
		} catch (execError) {
			console.error('unassign-task error:', execError);

			// Check if task not found
			if (execError.stderr?.includes('not found')) {
				return json({
					error: 'Task not found',
					message: `Task ${taskId} does not exist`,
					taskId
				}, { status: 404 });
			}

			return json({
				error: 'Failed to unassign task',
				message: execError.stderr || execError.message,
				agentName,
				taskId
			}, { status: 500 });
		}
	} catch (error) {
		console.error('Error in POST /api/agents/[name]/unassign-task:', error);
		return json({
			error: 'Internal server error',
			message: error.message
		}, { status: 500 });
	}
}
