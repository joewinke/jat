<script lang="ts">
	/**
	 * TaskDetailDrawer Component
	 * DaisyUI drawer for viewing/editing task details
	 *
	 * Features:
	 * - Side panel drawer (doesn't block view)
	 * - Dual mode: view and edit
	 * - Auto-save edit mode (debounced 500ms)
	 * - Fetches task data on mount
	 * - Mode toggle button
	 * - Optimistic updates with rollback
	 */

	import { tick } from 'svelte';

	// Props
	let { taskId = $bindable(null), mode = $bindable('view'), isOpen = $bindable(false) } = $props();

	// Task data state
	let task = $state(null);
	let loading = $state(false);
	let error = $state(null);

	// Edit mode state
	let formData = $state({
		title: '',
		description: '',
		priority: 1,
		type: 'task',
		status: 'open',
		project: '',
		labels: '',
		assignee: ''
	});

	// Auto-save state
	let isSaving = $state(false);
	let saveError = $state(null);
	let lastSaved = $state<Date | null>(null);
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	// UI state
	let validationErrors = $state({});
	let toastMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Status badge colors
	const statusColors = {
		open: 'badge-info',
		in_progress: 'badge-warning',
		closed: 'badge-success',
		blocked: 'badge-error'
	};

	// Priority badge colors
	const priorityColors = {
		0: 'badge-error', // P0 - Critical
		1: 'badge-warning', // P1 - High
		2: 'badge-info', // P2 - Medium
		3: 'badge-ghost', // P3 - Low
		4: 'badge-ghost' // P4 - Lowest
	};

	// Available options
	const priorityOptions = [
		{ value: 0, label: 'P0 (Critical)' },
		{ value: 1, label: 'P1 (High)' },
		{ value: 2, label: 'P2 (Medium)' },
		{ value: 3, label: 'P3 (Low)' },
		{ value: 4, label: 'P4 (Lowest)' }
	];

	const typeOptions = [
		{ value: 'task', label: 'Task' },
		{ value: 'bug', label: 'Bug' },
		{ value: 'feature', label: 'Feature' },
		{ value: 'epic', label: 'Epic' },
		{ value: 'chore', label: 'Chore' }
	];

	const statusOptions = [
		{ value: 'open', label: 'Open' },
		{ value: 'in_progress', label: 'In Progress' },
		{ value: 'blocked', label: 'Blocked' },
		{ value: 'closed', label: 'Closed' }
	];

	const projectOptions = ['jat', 'chimaro', 'jomarchy'];

	// Fetch task details
	async function fetchTask(id: string) {
		if (!id) return;

		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/tasks/${id}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch task: ${response.statusText}`);
			}
			const data = await response.json();
			task = data.task;

			// Populate form data for edit mode
			formData = {
				title: task.title || '',
				description: task.description || '',
				priority: task.priority ?? 1,
				type: task.type || 'task',
				status: task.status || 'open',
				project: task.project || '',
				labels: task.labels ? task.labels.join(', ') : '',
				assignee: task.assignee || ''
			};
		} catch (err: any) {
			error = err.message;
			console.error('Error fetching task:', err);
		} finally {
			loading = false;
		}
	}

	// Watch for taskId changes
	$effect(() => {
		if (taskId && isOpen) {
			fetchTask(taskId);
		}
	});

	// Format date
	function formatDate(dateString: string | null) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleString();
	}

	// Show toast notification
	function showToast(type: 'success' | 'error', text: string) {
		toastMessage = { type, text };
		setTimeout(() => {
			toastMessage = null;
		}, 3000); // Hide after 3 seconds
	}

	// Debounced auto-save function
	async function autoSave(field: string, value: any) {
		// Clear any pending save
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		// Debounce for 500ms
		saveTimeout = setTimeout(async () => {
			isSaving = true;
			saveError = null;

			// Create backup of current task for rollback
			const taskBackup = { ...task };

			try {
				// Optimistic update - update UI immediately
				if (task) {
					task = { ...task, [field]: value };
				}

				// Prepare PATCH request body (only the changed field)
				const updateData: any = {};
				updateData[field] = value;

				// Make PATCH request
				const response = await fetch(`/api/tasks/${taskId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updateData)
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.message || 'Failed to save');
				}

				const data = await response.json();

				// Update task with server response
				task = data.task;
				lastSaved = new Date();

				// Show success toast
				showToast('success', '✓ Saved');

			} catch (error: any) {
				console.error('Auto-save error:', error);

				// Rollback on error
				task = taskBackup;
				saveError = error.message;

				// Show error toast
				showToast('error', `✗ ${error.message}`);
			} finally {
				isSaving = false;
			}
		}, 500);
	}

	// Toggle between view and edit modes
	function toggleMode() {
		// Clear any pending save when toggling modes
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}

		if (mode === 'view') {
			mode = 'edit';
		} else {
			mode = 'view';
			// Reset form data to task data when switching back to view
			if (task) {
				formData = {
					title: task.title || '',
					description: task.description || '',
					priority: task.priority ?? 1,
					type: task.type || 'task',
					status: task.status || 'open',
					project: task.project || '',
					labels: task.labels ? task.labels.join(', ') : '',
					assignee: task.assignee || ''
				};
			}
		}
	}

	// Auto-save watchers for each field (only in edit mode)
	$effect(() => {
		if (mode === 'edit' && task && formData.title !== task.title) {
			autoSave('title', formData.title);
		}
	});

	$effect(() => {
		if (mode === 'edit' && task && formData.description !== task.description) {
			autoSave('description', formData.description);
		}
	});

	$effect(() => {
		if (mode === 'edit' && task && formData.priority !== task.priority) {
			autoSave('priority', formData.priority);
		}
	});

	$effect(() => {
		if (mode === 'edit' && task && formData.type !== task.type) {
			autoSave('type', formData.type);
		}
	});

	$effect(() => {
		if (mode === 'edit' && task && formData.status !== task.status) {
			autoSave('status', formData.status);
		}
	});

	$effect(() => {
		if (mode === 'edit' && task && formData.project !== task.project) {
			autoSave('project', formData.project);
		}
	});

	$effect(() => {
		if (mode === 'edit' && task && formData.assignee !== task.assignee) {
			autoSave('assignee', formData.assignee);
		}
	});

	// Handle drawer close
	function handleClose() {
		// Clear any pending save
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}

		if (!isSaving) {
			isOpen = false;
			// Reset to view mode on close
			mode = 'view';
			task = null;
			error = null;
			saveError = null;
			toastMessage = null;
			lastSaved = null;
		}
	}
</script>

<!-- DaisyUI Drawer -->
<div class="drawer drawer-end z-50">
	<input id="task-detail-drawer" type="checkbox" class="drawer-toggle" bind:checked={isOpen} />

	<!-- Drawer side -->
	<div class="drawer-side">
		<label
			for="task-detail-drawer"
			aria-label="close sidebar"
			class="drawer-overlay"
			onclick={handleClose}
		></label>

		<!-- Drawer Panel -->
		<div class="bg-base-100 min-h-full w-full max-w-2xl flex flex-col shadow-2xl">
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-base-300">
				<div class="flex-1">
					<div class="flex items-center gap-3">
						<h2 class="text-2xl font-bold text-base-content">
							{mode === 'view' ? 'Task Details' : 'Edit Task'}
						</h2>
						{#if task && mode === 'view'}
							<span class="badge badge-lg badge-outline">{task.id}</span>
						{/if}
					</div>
					<p class="text-sm text-base-content/70 mt-1">
						{#if mode === 'view'}
							Viewing task details
						{:else if isSaving}
							<span class="loading loading-spinner loading-xs"></span>
							Saving...
						{:else if lastSaved}
							✓ Saved {new Date().getTime() - lastSaved.getTime() < 60000
								? 'just now'
								: 'at ' + lastSaved.toLocaleTimeString()}
						{:else}
							Changes save automatically
						{/if}
					</p>
				</div>
				<div class="flex items-center gap-2">
					<!-- Mode toggle button -->
					{#if !loading && !error && task}
						<button
							class="btn btn-sm {mode === 'edit' ? 'btn-ghost' : 'btn-primary'}"
							onclick={toggleMode}
							disabled={isSaving}
						>
							{#if mode === 'view'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
								Edit
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
								View
							{/if}
						</button>
					{/if}
					<!-- VS Code deep link button -->
					{#if !loading && !error && task && task.project_path}
						<a
							href="vscode://file{task.project_path}?search={task.id}"
							class="btn btn-sm btn-ghost"
							title="Open in VS Code"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"
								/>
							</svg>
						</a>
					{/if}
					<!-- Close button -->
					<button
						class="btn btn-sm btn-circle btn-ghost"
						onclick={handleClose}
						disabled={isSaving}
						aria-label="Close drawer"
					>
						✕
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6">
				{#if loading}
					<!-- Loading state -->
					<div class="flex items-center justify-center py-12">
						<span class="loading loading-spinner loading-lg"></span>
					</div>
				{:else if error}
					<!-- Error state -->
					<div class="alert alert-error">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="stroke-current shrink-0 h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{error}</span>
					</div>
					<div class="mt-4">
						<button class="btn btn-primary" onclick={() => fetchTask(taskId)}>
							Retry
						</button>
					</div>
				{:else if task && mode === 'view'}
					<!-- View Mode -->
					<div class="space-y-6">
						<!-- Title -->
						<div>
							<h3 class="text-xl font-bold text-base-content mb-3">{task.title}</h3>
						</div>

						<!-- Badges -->
						<div class="flex flex-wrap gap-2">
							<div class="badge {statusColors[task.status] || 'badge-ghost'}">
								{task.status || 'unknown'}
							</div>
							<div class="badge {priorityColors[task.priority] || 'badge-ghost'}">
								P{task.priority ?? '?'}
							</div>
							<div class="badge badge-outline">{task.type || 'task'}</div>
							{#if task.project}
								<div class="badge badge-primary">{task.project}</div>
							{/if}
						</div>

						<!-- Labels -->
						{#if task.labels && task.labels.length > 0}
							<div>
								<h4 class="text-sm font-semibold mb-2 text-base-content/70">Labels</h4>
								<div class="flex flex-wrap gap-2">
									{#each task.labels as label}
										<span class="badge badge-sm badge-outline">{label}</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Description -->
						{#if task.description}
							<div>
								<h4 class="text-sm font-semibold mb-2 text-base-content/70">Description</h4>
								<p class="text-sm whitespace-pre-wrap text-base-content">{task.description}</p>
							</div>
						{/if}

						<!-- Dependencies -->
						{#if task.depends_on && task.depends_on.length > 0}
							<div>
								<h4 class="text-sm font-semibold mb-2 text-base-content/70">Depends On</h4>
								<div class="space-y-2">
									{#each task.depends_on as dep}
										<div class="flex items-center gap-2 text-sm p-2 bg-base-200 rounded">
											<span class="badge badge-sm {statusColors[dep.status] || 'badge-ghost'}">
												{dep.status || 'unknown'}
											</span>
											<span class="badge badge-sm {priorityColors[dep.priority] || 'badge-ghost'}">
												P{dep.priority ?? '?'}
											</span>
											<span class="font-mono text-xs">{dep.id}</span>
											<span class="flex-1">{dep.title || 'Untitled'}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Blocks (dependents) -->
						{#if task.blocked_by && task.blocked_by.length > 0}
							<div>
								<h4 class="text-sm font-semibold mb-2 text-base-content/70">Blocks</h4>
								<div class="space-y-2">
									{#each task.blocked_by as dep}
										<div class="flex items-center gap-2 text-sm p-2 bg-base-200 rounded">
											<span class="badge badge-sm {statusColors[dep.status] || 'badge-ghost'}">
												{dep.status || 'unknown'}
											</span>
											<span class="badge badge-sm {priorityColors[dep.priority] || 'badge-ghost'}">
												P{dep.priority ?? '?'}
											</span>
											<span class="font-mono text-xs">{dep.id}</span>
											<span class="flex-1">{dep.title || 'Untitled'}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Metadata -->
						<div class="border-t border-base-300 pt-4">
							<h4 class="text-sm font-semibold mb-3 text-base-content/70">Metadata</h4>
							<div class="text-xs text-base-content/60 space-y-2">
								<div class="flex justify-between">
									<strong>Created:</strong>
									<span>{formatDate(task.created_at)}</span>
								</div>
								<div class="flex justify-between">
									<strong>Updated:</strong>
									<span>{formatDate(task.updated_at)}</span>
								</div>
								{#if task.assignee}
									<div class="flex justify-between">
										<strong>Assignee:</strong>
										<span>{task.assignee}</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{:else if mode === 'edit'}
					<!-- Edit Mode - Auto-save (no form submission needed) -->
					<div class="space-y-6">
						<!-- Title (Required) -->
						<div class="form-control">
							<label class="label" for="edit-task-title">
								<span class="label-text font-semibold">
									Title
									<span class="text-error">*</span>
								</span>
							</label>
							<input
								id="edit-task-title"
								type="text"
								placeholder="Enter task title..."
								class="input input-bordered w-full {validationErrors.title ? 'input-error' : ''}"
								bind:value={formData.title}
								disabled={isSaving}
							/>
							{#if validationErrors.title}
								<label class="label">
									<span class="label-text-alt text-error">{validationErrors.title}</span>
								</label>
							{/if}
						</div>

						<!-- Description -->
						<div class="form-control">
							<label class="label" for="edit-task-description">
								<span class="label-text font-semibold">Description</span>
							</label>
							<textarea
								id="edit-task-description"
								placeholder="Enter task description..."
								class="textarea textarea-bordered w-full h-32"
								bind:value={formData.description}
								disabled={isSaving}
							></textarea>
						</div>

						<!-- Status, Priority, Type Row -->
						<div class="grid grid-cols-3 gap-4">
							<!-- Status -->
							<div class="form-control">
								<label class="label" for="edit-task-status">
									<span class="label-text font-semibold">Status</span>
								</label>
								<select
									id="edit-task-status"
									class="select select-bordered w-full"
									bind:value={formData.status}
									disabled={isSaving}
								>
									{#each statusOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</div>

							<!-- Priority -->
							<div class="form-control">
								<label class="label" for="edit-task-priority">
									<span class="label-text font-semibold">Priority</span>
								</label>
								<select
									id="edit-task-priority"
									class="select select-bordered w-full"
									bind:value={formData.priority}
									disabled={isSaving}
								>
									{#each priorityOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</div>

							<!-- Type -->
							<div class="form-control">
								<label class="label" for="edit-task-type">
									<span class="label-text font-semibold">Type</span>
								</label>
								<select
									id="edit-task-type"
									class="select select-bordered w-full"
									bind:value={formData.type}
									disabled={isSaving}
								>
									{#each typeOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</div>
						</div>

						<!-- Project -->
						<div class="form-control">
							<label class="label" for="edit-task-project">
								<span class="label-text font-semibold">Project</span>
							</label>
							<select
								id="edit-task-project"
								class="select select-bordered w-full"
								bind:value={formData.project}
								disabled={isSaving}
							>
								<option value="">No project</option>
								{#each projectOptions as project}
									<option value={project}>{project}</option>
								{/each}
							</select>
						</div>

						<!-- Labels -->
						<div class="form-control">
							<label class="label" for="edit-task-labels">
								<span class="label-text font-semibold">Labels</span>
							</label>
							<input
								id="edit-task-labels"
								type="text"
								placeholder="e.g., frontend, urgent, bug-fix"
								class="input input-bordered w-full"
								bind:value={formData.labels}
								disabled={isSaving}
							/>
							<label class="label">
								<span class="label-text-alt text-base-content/60">
									Comma-separated list of labels
								</span>
							</label>
						</div>

						<!-- Assignee -->
						<div class="form-control">
							<label class="label" for="edit-task-assignee">
								<span class="label-text font-semibold">Assignee</span>
							</label>
							<input
								id="edit-task-assignee"
								type="text"
								placeholder="Enter assignee name..."
								class="input input-bordered w-full"
								bind:value={formData.assignee}
								disabled={isSaving}
							/>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer Actions -->
			{#if !loading && !error && task}
				<div class="p-6 border-t border-base-300 bg-base-200">
					<div class="flex justify-end gap-3">
						<button type="button" class="btn btn-ghost" onclick={handleClose}>
							Close
						</button>
						{#if mode === 'edit'}
							<button type="button" class="btn btn-primary" onclick={toggleMode} disabled={isSaving}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
								View Mode
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Toast Notification (Fixed position, bottom-right) -->
	{#if toastMessage}
		<div class="toast toast-end toast-bottom z-[60]">
			<div class="alert {toastMessage.type === 'success' ? 'alert-success' : 'alert-error'}">
				<span>{toastMessage.text}</span>
			</div>
		</div>
	{/if}
</div>
