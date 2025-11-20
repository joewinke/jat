/**
 * Unified Agents API Endpoint
 *
 * GET /api/agents              → Simple agent list (lightweight, for dropdowns/lists)
 * GET /api/agents?full=true    → Full orchestration data (agents + tasks + reservations + stats)
 * GET /api/agents?orchestration=true → Alias for full orchestration data
 */

import { json } from '@sveltejs/kit';
import { getAgents, getReservations } from '$lib/server/agent-mail.js';
import { getTasks } from '../../../../../lib/beads.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	// Check if full orchestration data requested
	const fullData = url.searchParams.get('full') === 'true' ||
	                 url.searchParams.get('orchestration') === 'true';

	if (!fullData) {
		// Simple agent list (backward compatible)
		try {
			const agents = getAgents();
			return json({ agents });
		} catch (error) {
			console.error('Error fetching agents:', error);
			return json({ error: 'Failed to fetch agents', agents: [] }, { status: 500 });
		}
	}

	// Full orchestration data
	try {
		const projectFilter = url.searchParams.get('project');
		const agentFilter = url.searchParams.get('agent');

		// Fetch all data sources in parallel for performance
		const [agents, reservations, tasks] = await Promise.all([
			Promise.resolve(getAgents(projectFilter)),
			Promise.resolve(getReservations(agentFilter, projectFilter)),
			Promise.resolve(getTasks({ projectName: projectFilter }))
		]);

		// Calculate agent statistics
		const agentStats = agents.map(agent => {
			// Count reservations per agent
			const agentReservations = reservations.filter(r => r.agent_name === agent.name);

			// Count tasks assigned to agent
			const agentTasks = tasks.filter(t => t.assignee === agent.name);
			const openTasks = agentTasks.filter(t => t.status === 'open').length;
			const inProgressTasks = agentTasks.filter(t => t.status === 'in_progress').length;

			// Determine if agent is active based on reservations or active tasks
			const hasActiveReservations = agentReservations.some(r => {
				const expiresAt = new Date(r.expires_ts);
				return expiresAt > new Date() && !r.released_ts;
			});

			return {
				...agent,
				reservation_count: agentReservations.length,
				task_count: agentTasks.length,
				open_tasks: openTasks,
				in_progress_tasks: inProgressTasks,
				active: hasActiveReservations || inProgressTasks > 0
			};
		});

		// Group reservations by agent for easy lookup
		const reservationsByAgent = {};
		reservations.forEach(r => {
			if (!reservationsByAgent[r.agent_name]) {
				reservationsByAgent[r.agent_name] = [];
			}
			reservationsByAgent[r.agent_name].push(r);
		});

		// Calculate task statistics
		const taskStats = {
			total: tasks.length,
			open: tasks.filter(t => t.status === 'open').length,
			in_progress: tasks.filter(t => t.status === 'in_progress').length,
			blocked: tasks.filter(t => t.status === 'blocked').length,
			closed: tasks.filter(t => t.status === 'closed').length,
			by_priority: {
				p0: tasks.filter(t => t.priority === 0).length,
				p1: tasks.filter(t => t.priority === 1).length,
				p2: tasks.filter(t => t.priority === 2).length,
				p3: tasks.filter(t => t.priority === 3).length,
				p4: tasks.filter(t => t.priority === 4).length
			}
		};

		// Find tasks with dependencies for visualization
		const tasksWithDeps = tasks.filter(t =>
			(t.depends_on && t.depends_on.length > 0) ||
			(t.blocked_by && t.blocked_by.length > 0)
		);

		// Find unassigned tasks (ready for assignment)
		const unassignedTasks = tasks.filter(t =>
			!t.assignee && t.status === 'open'
		);

		// Return unified orchestration data
		return json({
			agents: agentStats,
			reservations,
			reservations_by_agent: reservationsByAgent,
			tasks: tasks.slice(0, 100), // Limit to 100 most recent for performance
			unassigned_tasks: unassignedTasks,
			task_stats: taskStats,
			tasks_with_deps_count: tasksWithDeps.length,
			tasks_with_deps: tasksWithDeps,
			timestamp: new Date().toISOString(),
			meta: {
				poll_interval_ms: 3000, // Recommended poll interval for frontend
				data_sources: ['agent-mail', 'beads'],
				cache_ttl_ms: 2000 // Data freshness guarantee
			}
		});
	} catch (error) {
		console.error('Error fetching orchestration data:', error);
		console.error('Error stack:', error.stack);

		return json({
			error: 'Failed to fetch orchestration data',
			message: error.message,
			stack: error.stack,
			agents: [],
			reservations: [],
			reservations_by_agent: {},
			tasks: [],
			unassigned_tasks: [],
			task_stats: {
				total: 0,
				open: 0,
				in_progress: 0,
				blocked: 0,
				closed: 0,
				by_priority: { p0: 0, p1: 0, p2: 0, p3: 0, p4: 0 }
			},
			tasks_with_deps_count: 0,
			tasks_with_deps: [],
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
}
