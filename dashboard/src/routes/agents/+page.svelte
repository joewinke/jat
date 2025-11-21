<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import TaskQueue from '$lib/components/agents/TaskQueue.svelte';
	import AgentGrid from '$lib/components/agents/AgentGrid.svelte';
	import ClaudeUsageBar from '$lib/components/ClaudeUsageBar.svelte';
	import {
		getProjectsFromTasks,
		getTaskCountByProject
	} from '$lib/utils/projectUtils';
	import { formatTokens, formatCost, getUsageColor } from '$lib/utils/numberFormat';

	let tasks = $state([]);
	let allTasks = $state([]);  // Unfiltered tasks for project list calculation
	let agents = $state([]);
	let reservations = $state([]);
	let unassignedTasks = $state([]);
	let taskStats = $state(null);
	let selectedProject = $state('All Projects');

	// Extract unique projects from ALL tasks (unfiltered)
	const projects = $derived(getProjectsFromTasks(allTasks));

	// Get task count per project from ALL tasks (only count 'open' tasks to match TaskQueue default)
	const taskCounts = $derived(getTaskCountByProject(allTasks, 'open'));

	// Calculate system-wide usage statistics
	const systemStats = $derived(() => {
		if (!agents || agents.length === 0) {
			return {
				tokensToday: 0,
				costToday: 0,
				tokensWeek: 0,
				costWeek: 0,
				activeAgents: 0
			};
		}

		let tokensToday = 0;
		let costToday = 0;
		let tokensWeek = 0;
		let costWeek = 0;
		let activeAgents = 0;

		agents.forEach(agent => {
			// Count agents with tasks as active
			if (agent.tasks && agent.tasks.length > 0) {
				activeAgents++;
			}

			// Aggregate token usage (from usage field if available)
			if (agent.usage) {
				tokensToday += agent.usage.tokens_today || 0;
				costToday += agent.usage.cost_today || 0;
				tokensWeek += agent.usage.tokens_week || 0;
				costWeek += agent.usage.cost_week || 0;
			}
		});

		return {
			tokensToday,
			costToday,
			tokensWeek,
			costWeek,
			activeAgents
		};
	});

	// Calculate top consumers (top 3 agents by token usage today)
	const topConsumers = $derived(() => {
		if (!agents || agents.length === 0) {
			return [];
		}

		// Filter agents with usage data, sort by tokens today, take top 3
		return agents
			.filter(agent => agent.usage && agent.usage.tokens_today > 0)
			.sort((a, b) => (b.usage?.tokens_today || 0) - (a.usage?.tokens_today || 0))
			.slice(0, 3)
			.map(agent => ({
				name: agent.name,
				tokens: agent.usage?.tokens_today || 0,
				cost: agent.usage?.cost_today || 0
			}));
	});

	// Handle project selection change
	function handleProjectChange(project: string) {
		selectedProject = project;

		// Update URL parameter using SvelteKit's replaceState
		const url = new URL(window.location.href);
		if (project === 'All Projects') {
			url.searchParams.delete('project');
		} else {
			url.searchParams.set('project', project);
		}
		replaceState(url, {});

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
			// Build URL with project filter and token usage
			let url = '/api/agents?full=true&usage=true';
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

			// Update allTasks when viewing all projects (for dropdown options)
			if (selectedProject === 'All Projects') {
				allTasks = data.tasks || [];
			}
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
	<!-- Main Content: Sidebar + Agent Grid -->
	<div class="flex h-[calc(100vh-theme(spacing.20))] pb-20">
		<!-- Left Sidebar: Task Queue -->
		<div class="w-80 border-r border-base-300 bg-base-100 flex flex-col">
			<TaskQueue
				tasks={unassignedTasks}
				{agents}
				{reservations}
				{selectedProject}
			/>
		</div>

		<!-- Right Panel: Agent Grid -->
		<div class="flex-1 overflow-auto">
			<!-- System-Wide Usage Summary -->
			<div class="collapse collapse-arrow bg-base-100 border border-base-300 m-4">
				<input type="checkbox" checked />
				<div class="collapse-title text-lg font-semibold">
					System Usage Overview
				</div>
				<div class="collapse-content">
					<!-- Stats Grid (responsive: 1 col mobile, 2 cols tablet+) -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<!-- System Stats Card -->
						<div class="stats stats-vertical shadow bg-base-200">
							<div class="stat">
								<div class="stat-title">Total Tokens (Today)</div>
								<div class="stat-value text-{getUsageColor(systemStats().tokensToday, 'today')}">
									{formatTokens(systemStats().tokensToday)}
								</div>
								<div class="stat-desc">Cost: {formatCost(systemStats().costToday)}</div>
							</div>

							<div class="stat">
								<div class="stat-title">Total Tokens (Week)</div>
								<div class="stat-value text-{getUsageColor(systemStats().tokensWeek, 'week')}">
									{formatTokens(systemStats().tokensWeek)}
								</div>
								<div class="stat-desc">Cost: {formatCost(systemStats().costWeek)}</div>
							</div>

							<div class="stat">
								<div class="stat-title">Active Agents</div>
								<div class="stat-value text-primary">{systemStats().activeAgents}</div>
								<div class="stat-desc">of {agents.length} total agents</div>
							</div>
						</div>

						<!-- Top Consumers Card -->
						<div class="card bg-base-200 shadow">
							<div class="card-body">
								<h3 class="card-title text-base">Top Consumers (Today)</h3>
								{#if topConsumers().length > 0}
									<ul class="space-y-2">
										{#each topConsumers() as consumer, index}
											<li class="flex justify-between items-center">
												<span class="font-medium">
													{index + 1}. {consumer.name}
												</span>
												<span class="text-sm text-{getUsageColor(consumer.tokens, 'today')}">
													{formatTokens(consumer.tokens)} ({formatCost(consumer.cost)})
												</span>
											</li>
										{/each}
									</ul>
								{:else}
									<p class="text-sm text-base-content/60">No usage data available</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>

			<AgentGrid {agents} {tasks} {allTasks} {reservations} onTaskAssign={handleTaskAssign} />
		</div>
	</div>

	<!-- Claude API Usage Bar (Fixed Bottom) -->
	<ClaudeUsageBar />
</div>
