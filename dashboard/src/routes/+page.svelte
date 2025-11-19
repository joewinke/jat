<script>
	import TaskList from '$lib/components/TaskList.svelte';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';

	let selectedProject = $state('all');
	let selectedPriority = $state('all');
	let selectedStatus = $state('all');
	let searchQuery = $state('');
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
		<div class="flex-none">
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

	<TaskList
		bind:selectedProject
		bind:selectedPriority
		bind:selectedStatus
		bind:searchQuery
	/>
</div>
