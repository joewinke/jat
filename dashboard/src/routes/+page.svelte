<script>
	import TaskList from '$lib/components/TaskList.svelte';

	let selectedProject = $state('all');
	let selectedPriority = $state('all');
	let selectedStatus = $state('all');
	let searchQuery = $state('');
</script>

<div class="dashboard">
	<header class="dashboard-header">
		<h1>Beads Task Dashboard</h1>
		<p>Multi-project task management powered by Beads + Agent Mail</p>
	</header>

	<div class="filters">
		<div class="filter-group">
			<label for="project-filter">Project:</label>
			<select id="project-filter" bind:value={selectedProject}>
				<option value="all">All Projects</option>
				<option value="chimaro">Chimaro</option>
				<option value="jomarchy">Jomarchy</option>
				<option value="jomarchy-agent-tools">JAT</option>
			</select>
		</div>

		<div class="filter-group">
			<label for="priority-filter">Priority:</label>
			<select id="priority-filter" bind:value={selectedPriority}>
				<option value="all">All Priorities</option>
				<option value="0">P0 (Critical)</option>
				<option value="1">P1 (High)</option>
				<option value="2">P2 (Medium)</option>
				<option value="3">P3 (Low)</option>
			</select>
		</div>

		<div class="filter-group">
			<label for="status-filter">Status:</label>
			<select id="status-filter" bind:value={selectedStatus}>
				<option value="all">All Statuses</option>
				<option value="open">Open</option>
				<option value="closed">Closed</option>
			</select>
		</div>

		<div class="filter-group">
			<label for="search-filter">Search:</label>
			<input
				id="search-filter"
				type="text"
				placeholder="Search tasks..."
				bind:value={searchQuery}
			/>
		</div>
	</div>

	<TaskList
		bind:selectedProject
		bind:selectedPriority
		bind:selectedStatus
		bind:searchQuery
	/>
</div>

<style>
	.dashboard {
		min-height: 100vh;
		background: #f9fafb;
	}

	.dashboard-header {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		padding: 2rem;
		text-align: center;
	}

	.dashboard-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: #111827;
	}

	.dashboard-header p {
		margin: 0;
		color: #6b7280;
		font-size: 1rem;
	}

	.filters {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		padding: 1rem 2rem;
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.filter-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.filter-group select,
	.filter-group input {
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
	}

	.filter-group select {
		cursor: pointer;
	}

	.filter-group input {
		min-width: 200px;
	}

	.filter-group select:focus,
	.filter-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
</style>
