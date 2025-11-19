<script>
	/**
	 * TaskModal Component
	 * Displays full task details including dependencies and dependency graph
	 */

	// Props
	let { task = $bindable(null), onClose = () => {} } = $props();

	// Priority labels
	const priorityLabels = {
		0: 'P0 (Critical)',
		1: 'P1 (High)',
		2: 'P2 (Medium)',
		3: 'P3 (Low)',
		4: 'P4 (Lowest)'
	};

	// Close modal on escape key
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	// Close modal on backdrop click
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

{#if task}
	<div class="modal modal-open" onclick={handleBackdropClick} onkeydown={handleKeydown} role="dialog">
		<div class="modal-box max-w-4xl">
			<div class="flex justify-between items-start mb-4">
				<h2 class="text-2xl font-bold text-base-content">{task.title}</h2>
				<button
					class="btn btn-sm btn-circle btn-ghost"
					onclick={onClose}
					aria-label="Close modal"
				>
					✕
				</button>
			</div>

			<div class="space-y-4">
				<div class="flex flex-wrap gap-2 p-3 bg-base-200 rounded-lg">
					<div class="badge badge-outline">
						<span class="font-semibold mr-1">ID:</span>
						{task.id}
					</div>
					<div class="badge badge-outline">
						<span class="font-semibold mr-1">Project:</span>
						{task.project}
					</div>
					<div class="badge badge-outline">
						<span class="font-semibold mr-1">Priority:</span>
						{priorityLabels[task.priority] || `P${task.priority}`}
					</div>
					<div class="badge {task.status === 'open' ? 'badge-primary' : 'badge-success'}">
						{task.status}
					</div>
					{#if task.issue_type}
						<div class="badge badge-outline">
							<span class="font-semibold mr-1">Type:</span>
							{task.issue_type}
						</div>
					{/if}
				</div>

				{#if task.description}
					<div>
						<h3 class="text-lg font-semibold text-base-content mb-2">Description</h3>
						<p class="text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed">
							{task.description}
						</p>
					</div>
					<div class="divider"></div>
				{/if}

				{#if task.acceptance_criteria}
					<div>
						<h3 class="text-lg font-semibold text-base-content mb-2">Acceptance Criteria</h3>
						<p class="text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed">
							{task.acceptance_criteria}
						</p>
					</div>
					<div class="divider"></div>
				{/if}

				{#if task.labels && task.labels.length > 0}
					<div>
						<h3 class="text-lg font-semibold text-base-content mb-2">Labels</h3>
						<div class="flex flex-wrap gap-2">
							{#each task.labels as label}
								<span class="badge badge-ghost">{label}</span>
							{/each}
						</div>
					</div>
					<div class="divider"></div>
				{/if}

				{#if task.dependencies && task.dependencies.length > 0}
					<div>
						<h3 class="text-lg font-semibold text-base-content mb-2">Dependencies</h3>
						<div class="alert alert-info">
							<div>
								<p class="text-sm font-medium mb-2">This task depends on:</p>
								<pre class="text-xs font-mono overflow-x-auto">{task.id}
{#each task.dependencies as dep, i}
{i === task.dependencies.length - 1 ? '└──' : '├──'} {dep}
{/each}</pre>
							</div>
						</div>
					</div>
					<div class="divider"></div>
				{/if}

				{#if task.enables && task.enables.length > 0}
					<div>
						<h3 class="text-lg font-semibold text-base-content mb-2">Enables</h3>
						<div class="alert alert-success">
							<div>
								<p class="text-sm font-medium mb-2">Completing this task will enable:</p>
								<ul class="list-disc list-inside text-sm space-y-1">
									{#each task.enables as enabled}
										<li class="font-mono">{enabled}</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
					<div class="divider"></div>
				{/if}

				<div>
					<h3 class="text-lg font-semibold text-base-content mb-2">Timestamps</h3>
					<div class="bg-base-200 p-3 rounded-lg space-y-2">
						<div class="flex gap-2 text-sm">
							<span class="font-semibold text-base-content/70">Created:</span>
							<span class="text-base-content">{new Date(task.created_at).toLocaleString()}</span>
						</div>
						<div class="flex gap-2 text-sm">
							<span class="font-semibold text-base-content/70">Updated:</span>
							<span class="text-base-content">{new Date(task.updated_at).toLocaleString()}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
