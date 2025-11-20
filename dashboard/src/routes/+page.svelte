<script>
	import { onMount } from 'svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import DependencyGraph from '$lib/components/DependencyGraph.svelte';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
	import TaskDetailModal from '$lib/components/TaskDetailModal.svelte';

	let selectedProject = $state('all');
	let selectedPriority = $state('all');
	let selectedStatus = $state('all');
	let searchQuery = $state('');
	let viewMode = $state('list'); // 'list' or 'graph'
	let tasks = $state([]);
	let selectedTaskId = $state(null);

	// Fetch tasks based on filters
	async function fetchTasks() {
		const params = new URLSearchParams();
		if (selectedProject !== 'all') params.append('project', selectedProject);
		if (selectedStatus !== 'all') params.append('status', selectedStatus);
		if (selectedPriority !== 'all') params.append('priority', selectedPriority);

		const response = await fetch(`/api/tasks?${params}`);
		const data = await response.json();
		tasks = data.tasks || [];
	}

	// Handle node click in graph
	function handleNodeClick(taskId) {
		selectedTaskId = taskId;
	}

	// Handle modal close
	function handleModalClose() {
		selectedTaskId = null;
	}

	// Fetch tasks when filters change
	$effect(() => {
		fetchTasks();
	});

	onMount(() => {
		fetchTasks();
	});
</script>

<div class="min-h-screen bg-base-200">
	<div class="navbar bg-base-100 border-b border-base-300">
		<div class="flex-1">
			<div>
				<h1 class="text-2xl font-bold text-base-content">Beads Task Dashboard</h1>
				<p class="text-sm text-base-content/70">
					Multi-project task management powered by Beads + Agent Mail
				</p>
			</div>
		</div>
		<div class="flex-none gap-2">
			<!-- View Mode Toggle -->
			<div class="join">
				<button
					class="btn btn-sm join-item {viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}"
					onclick={() => (viewMode = 'list')}
				>
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
					List
				</button>
				<button
					class="btn btn-sm join-item {viewMode === 'graph' ? 'btn-primary' : 'btn-ghost'}"
					onclick={() => (viewMode = 'graph')}
				>
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
							d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
						/>
					</svg>
					Graph
				</button>
			</div>
			<!-- Agents Link -->
			<a href="/agents" class="btn btn-sm btn-ghost">
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
				Agents
			</a>
			<ThemeSelector />
		</div>
	</div>

	<div class="bg-base-100 border-b border-base-300 p-4">
		<div class="flex flex-wrap gap-4">
			<div class="form-control">
				<label class="label" for="project-filter">
					<span class="label-text">Project</span>
				</label>
				<select id="project-filter" class="select select-bordered select-sm" bind:value={selectedProject}>
					<option value="all">All Projects</option>
					<option value="chimaro">Chimaro</option>
					<option value="jomarchy">Jomarchy</option>
					<option value="jomarchy-agent-tools">JAT</option>
				</select>
			</div>

			<div class="form-control">
				<label class="label" for="priority-filter">
					<span class="label-text">Priority</span>
				</label>
				<select id="priority-filter" class="select select-bordered select-sm" bind:value={selectedPriority}>
					<option value="all">All Priorities</option>
					<option value="0">P0 (Critical)</option>
					<option value="1">P1 (High)</option>
					<option value="2">P2 (Medium)</option>
					<option value="3">P3 (Low)</option>
				</select>
			</div>

			<div class="form-control">
				<label class="label" for="status-filter">
					<span class="label-text">Status</span>
				</label>
				<select id="status-filter" class="select select-bordered select-sm" bind:value={selectedStatus}>
					<option value="all">All Statuses</option>
					<option value="open">Open</option>
					<option value="closed">Closed</option>
				</select>
			</div>

			<div class="form-control">
				<label class="label" for="search-filter">
					<span class="label-text">Search</span>
				</label>
				<input
					id="search-filter"
					type="text"
					placeholder="Search tasks..."
					class="input input-bordered input-sm"
					bind:value={searchQuery}
				/>
			</div>
		</div>
	</div>

	{#if viewMode === 'list'}
		<TaskList
			bind:selectedProject
			bind:selectedPriority
			bind:selectedStatus
			bind:searchQuery
		/>
	{:else}
		<div class="p-4">
			<DependencyGraph {tasks} onNodeClick={handleNodeClick} />
		</div>
	{/if}

	<!-- Task Detail Modal -->
	<TaskDetailModal taskId={selectedTaskId} onClose={handleModalClose} />
</div>
