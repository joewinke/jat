<script lang="ts">
	import { onMount } from 'svelte';
	import TaskQueue from '$lib/components/agents/TaskQueue.svelte';
	import AgentGrid from '$lib/components/agents/AgentGrid.svelte';
	import SystemCapacityBar from '$lib/components/agents/SystemCapacityBar.svelte';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
	import ProjectSelector from '$lib/components/ProjectSelector.svelte';
	import {
		getProjectsFromTasks,
		getTaskCountByProject
	} from '$lib/utils/projectUtils';

	let tasks = $state([]);
	let agents = $state([]);
	let reservations = $state([]);
	let unassignedTasks = $state([]);
	let taskStats = $state(null);
	let selectedProject = $state('All Projects');

	// Extract unique projects from tasks
	const projects = $derived(getProjectsFromTasks(tasks));

	// Get task count per project
	const taskCounts = $derived(getTaskCountByProject(tasks));

	// Handle project selection change
	function handleProjectChange(project: string) {
		selectedProject = project;

		// Update URL parameter
		const url = new URL(window.location.href);
		if (project === 'All Projects') {
			// Remove project param for "All Projects"
			url.searchParams.delete('project');
		} else {
			url.searchParams.set('project', project);
		}
		window.history.replaceState({}, '', url.toString());

		// Refetch data with new project filter
		fetchData();
	}

	// Sync selectedProject from URL params on mount
	$effect(() => {
		const params = new URLSearchParams(window.location.search);
		const projectParam = params.get('project');
		if (projectParam && projectParam !== 'All Projects') {
			selectedProject = projectParam;
		} else {
			selectedProject = 'All Projects';
		}
	});

	// Fetch agent data from unified API
	async function fetchData() {
		try {
			// Build URL with project filter
			let url = '/api/agents?full=true';
			if (selectedProject && selectedProject !== 'All Projects') {
				url += `&project=${encodeURIComponent(selectedProject)}`;
			}

			const response = await fetch(url);
			const data = await response.json();

			if (data.error) {
				console.error('API error:', data.error);
				return;
			}

			// Update state with real data
			agents = data.agents || [];
			reservations = data.reservations || [];
			tasks = data.tasks || [];
			unassignedTasks = data.unassigned_tasks || [];
			taskStats = data.task_stats || null;
		} catch (error) {
			console.error('Failed to fetch agent data:', error);
		}
	}

	// Handle task assignment via drag-and-drop
	async function handleTaskAssign(taskId, agentName) {
		try {
			const response = await fetch('/api/agents', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ taskId, agentName })
			});

			const result = await response.json();

			if (!response.ok || result.error) {
				console.error('Failed to assign task:', result.error || result.message);
				throw new Error(result.message || 'Failed to assign task');
			}

			// Immediately refresh data to show updated assignment
			await fetchData();

			console.log(`Task ${taskId} successfully assigned to ${agentName}`);
		} catch (error) {
			console.error('Error assigning task:', error);
			throw error;
		}
	}

	// Auto-refresh data every 5 seconds using Svelte reactivity
	$effect(() => {
		const interval = setInterval(fetchData, 5000);
		return () => clearInterval(interval);
	});

	onMount(() => {
		fetchData();
	});
</script>

<div class="min-h-screen bg-base-200">
	<!-- Header -->
	<div class="navbar bg-base-100 border-b border-base-300">
		<div class="flex-1">
			<div>
				<h1 class="text-2xl font-bold text-base-content">Agents</h1>
				<p class="text-sm text-base-content/70">
					Task assignment and agent coordination powered by Agent Mail + Beads
				</p>
			</div>
		</div>
		<div class="flex-none gap-2">
			<!-- View Mode Toggle -->
			<div class="join">
				<a href="/" class="btn btn-sm btn-ghost join-item">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-4 h-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
						/>
					</svg>
					List View
				</a>
				<button class="btn btn-sm btn-primary join-item">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-4 h-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
						/>
					</svg>
					Agent View
				</button>
			</div>
			<div class="w-48">
				<ProjectSelector
					{projects}
					{selectedProject}
					onProjectChange={handleProjectChange}
					{taskCounts}
					compact={true}
				/>
			</div>
			<ThemeSelector />
		</div>
	</div>

	<!-- Main Content: Sidebar + Agent Grid -->
	<div class="flex h-[calc(100vh-theme(spacing.20))] pb-20">
		<!-- Left Sidebar: Task Queue -->
		<div class="w-80 border-r border-base-300 bg-base-100 flex flex-col">
			<TaskQueue
				tasks={unassignedTasks}
				{agents}
				{reservations}
				{selectedProject}
				{projects}
				onProjectChange={handleProjectChange}
				{taskCounts}
			/>
		</div>

		<!-- Right Panel: Agent Grid -->
		<div class="flex-1 overflow-auto">
			<AgentGrid {agents} {tasks} {reservations} onTaskAssign={handleTaskAssign} />
		</div>
	</div>

	<!-- System-Wide Capacity Bar (Fixed Bottom) -->
	<SystemCapacityBar {agents} {tasks} />
</div>
