/**
 * Tasks API Route
 * Provides Beads task data to the dashboard
 */
import { json } from '@sveltejs/kit';
import { getTasks, getProjects } from '../../../../../lib/beads.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const project = url.searchParams.get('project');
	const status = url.searchParams.get('status');
	const priority = url.searchParams.get('priority');

	const filters = {};
	if (project) filters.project = project;
	if (status) filters.status = status;
	if (priority !== null) filters.priority = parseInt(priority);

	const tasks = getTasks(filters);
	const projects = getProjects();

	return json({
		tasks,
		projects,
		count: tasks.length
	});
}
