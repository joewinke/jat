<script>
	/**
	 * TaskList Component
	 * Displays Beads tasks with filtering using Svelte 5 $derived runes
	 */

	// Props
	let {
		selectedProject = $bindable('all'),
		selectedPriority = $bindable('all'),
		selectedStatus = $bindable('all'),
		searchQuery = $bindable('')
	} = $props();

	// State
	let tasks = $state([]);
	let projects = $state([]);
	let loading = $state(true);
	let error = $state(null);
	let lastUpdated = $state(null);

	// Priority colors
	const priorityColors = {
		0: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'P0' },
		1: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', label: 'P1' },
		2: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', label: 'P2' },
		3: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'P3' },
		4: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', label: 'P4' }
	};

	// Project colors (deterministic based on project name)
	function getProjectColor(projectName) {
		const colors = [
			{ bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
			{ bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
			{ bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
			{ bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
			{ bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' }
		];
		const hash = projectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		return colors[hash % colors.length];
	}

	// Reactive filtered tasks using $derived
	const filteredTasks = $derived(
		tasks.filter((task) => {
			if (selectedProject !== 'all' && task.project !== selectedProject) return false;
			if (selectedPriority !== 'all' && task.priority !== parseInt(selectedPriority)) return false;
			if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;

			// Search filter: match against title or description
			if (searchQuery && searchQuery.trim()) {
				const query = searchQuery.toLowerCase();
				const matchTitle = task.title.toLowerCase().includes(query);
				const matchDesc = task.description?.toLowerCase().includes(query);
				if (!matchTitle && !matchDesc) return false;
			}

			return true;
		})
	);

	// Fetch tasks
	async function fetchTasks(silent = false) {
		if (!silent) loading = true;
		error = null;
		try {
			const response = await fetch('/api/tasks');
			if (!response.ok) throw new Error('Failed to fetch tasks');
			const data = await response.json();
			tasks = data.tasks;
			projects = data.projects;
			lastUpdated = new Date();
		} catch (err) {
			error = err.message;
		} finally {
			if (!silent) loading = false;
		}
	}

	// Load tasks on mount and set up auto-refresh
	$effect(() => {
		// Initial load
		fetchTasks();

		// Set up polling for real-time updates (every 2 seconds)
		const interval = setInterval(() => {
			fetchTasks(true); // Silent refresh (no loading indicator)
		}, 2000);

		// Cleanup: clear interval when component unmounts
		return () => {
			clearInterval(interval);
		};
	});
</script>

<div class="task-list">
	{#if loading}
		<div class="loading">Loading tasks...</div>
	{:else if error}
		<div class="error">Error: {error}</div>
	{:else}
		<div class="task-count">
			<span>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
			{#if lastUpdated}
				<span class="last-updated">
					• Updated {lastUpdated.toLocaleTimeString()}
				</span>
			{/if}
		</div>

		<div class="tasks">
			{#each filteredTasks as task (task.id)}
				{@const priorityStyle = priorityColors[task.priority] || priorityColors[2]}
				{@const projectStyle = getProjectColor(task.project)}

				<div class="task-item">
					<div class="task-header">
						<span class="task-id {projectStyle.bg} {projectStyle.text} {projectStyle.border}">
							{task.project}-{task.id.split('-').pop()}
						</span>
						<span class="task-priority {priorityStyle.bg} {priorityStyle.text} {priorityStyle.border}">
							{priorityStyle.label}
						</span>
						<span class="task-status {task.status === 'open' ? 'status-open' : 'status-closed'}">
							{task.status}
						</span>
					</div>

					<h3 class="task-title">{task.title}</h3>

					{#if task.description}
						<p class="task-description">{task.description.slice(0, 150)}{task.description.length > 150 ? '...' : ''}</p>
					{/if}

					<div class="task-meta">
						<span class="project-badge {projectStyle.bg} {projectStyle.text}">
							{task.project}
						</span>
						{#if task.labels && task.labels.length > 0}
							<div class="task-labels">
								{#each task.labels.slice(0, 3) as label}
									<span class="label">{label}</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.task-list {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}

	.loading,
	.error {
		text-align: center;
		padding: 2rem;
		font-size: 1.1rem;
	}

	.error {
		color: #dc2626;
	}

	.task-count {
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: #6b7280;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.last-updated {
		color: #9ca3af;
		font-size: 0.8rem;
	}

	.tasks {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.task-item {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		transition: box-shadow 0.2s;
	}

	.task-item:hover {
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}

	.task-header {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.task-id,
	.task-priority,
	.task-status {
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		border: 1px solid;
	}

	.task-status {
		margin-left: auto;
		text-transform: uppercase;
		font-size: 0.7rem;
	}

	.status-open {
		background: #dbeafe;
		color: #1e40af;
		border-color: #93c5fd;
	}

	.status-closed {
		background: #d1fae5;
		color: #065f46;
		border-color: #6ee7b7;
	}

	.task-title {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.task-description {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0 0 0.75rem 0;
		line-height: 1.5;
	}

	.task-meta {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.project-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.task-labels {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.label {
		background: #f3f4f6;
		color: #374151;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.7rem;
	}
</style>
