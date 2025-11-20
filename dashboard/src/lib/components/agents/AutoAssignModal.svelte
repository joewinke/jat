<script>
	let { assignments, onConfirm, onCancel, isAssigning = false } = $props();

	// Calculate summary stats
	const highConfidence = $derived(assignments.filter(a => a.confidence === 'high').length);
	const mediumConfidence = $derived(assignments.filter(a => a.confidence === 'medium').length);
	const lowConfidence = $derived(assignments.filter(a => a.confidence === 'low').length);
	const totalWarnings = $derived(assignments.reduce((sum, a) => sum + a.warnings.length, 0));
</script>

<!-- Modal Overlay -->
<div class="modal modal-open">
	<div class="modal-box max-w-4xl">
		<!-- Header -->
		<h3 class="font-bold text-lg mb-2">Auto-Assign Preview</h3>
		<p class="text-sm text-base-content/70 mb-4">
			Review the proposed task assignments before applying them
		</p>

		<!-- Summary Stats -->
		<div class="stats shadow w-full mb-4">
			<div class="stat">
				<div class="stat-title">Total Assignments</div>
				<div class="stat-value text-primary">{assignments.length}</div>
			</div>

			<div class="stat">
				<div class="stat-title">High Confidence</div>
				<div class="stat-value text-success text-2xl">{highConfidence}</div>
			</div>

			<div class="stat">
				<div class="stat-title">Medium</div>
				<div class="stat-value text-warning text-2xl">{mediumConfidence}</div>
			</div>

			<div class="stat">
				<div class="stat-title">Low</div>
				<div class="stat-value text-error text-2xl">{lowConfidence}</div>
			</div>

			{#if totalWarnings > 0}
				<div class="stat">
					<div class="stat-title">Warnings</div>
					<div class="stat-value text-warning text-2xl">{totalWarnings}</div>
				</div>
			{/if}
		</div>

		<!-- Assignment List -->
		<div class="overflow-y-auto max-h-96 border border-base-300 rounded-lg">
			{#if assignments.length === 0}
				<div class="p-8 text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-12 h-12 mx-auto text-base-content/20 mb-2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<h4 class="font-medium text-base-content/70 mb-1">No Assignments Available</h4>
					<p class="text-sm text-base-content/50">
						All tasks are either assigned, blocked, or no suitable agents are available.
					</p>
				</div>
			{:else}
				{#each assignments as assignment, idx (assignment.task.id)}
					<div
						class="p-4 border-b border-base-300 hover:bg-base-200/50 transition-colors"
						class:bg-base-200={idx % 2 === 0}
					>
						<!-- Assignment Row -->
						<div class="flex items-start justify-between gap-4">
							<!-- Agent -->
							<div class="flex-shrink-0 w-32">
								<div class="text-xs text-base-content/50 mb-1">Agent</div>
								<div class="font-medium text-sm">{assignment.agent.name}</div>
								<div class="text-xs text-base-content/60 mt-1">
									Load: {assignment.agent.task_count} tasks, {assignment.agent
										.reservation_count} locks
								</div>
							</div>

							<!-- Arrow -->
							<div class="flex-shrink-0 pt-4">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									class="w-5 h-5 text-base-content/30"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
									/>
								</svg>
							</div>

							<!-- Task -->
							<div class="flex-1 min-w-0">
								<div class="flex items-start justify-between gap-2 mb-1">
									<div class="flex items-center gap-2">
										<span class="badge badge-xs badge-primary">P{assignment.task.priority}</span>
										<code class="text-xs text-base-content/70">{assignment.task.id}</code>
									</div>

									<!-- Confidence Badge -->
									<span
										class="badge badge-sm"
										class:badge-success={assignment.confidence === 'high'}
										class:badge-warning={assignment.confidence === 'medium'}
										class:badge-error={assignment.confidence === 'low'}
									>
										{assignment.confidence}
									</span>
								</div>

								<div class="text-sm font-medium text-base-content mb-1">
									{assignment.task.title}
								</div>

								<!-- Warnings -->
								{#if assignment.warnings.length > 0}
									<div class="mt-2 space-y-1">
										{#each assignment.warnings as warning}
											<div class="flex items-start gap-2">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="1.5"
													stroke="currentColor"
													class="w-4 h-4 text-warning flex-shrink-0 mt-0.5"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
													/>
												</svg>
												<span class="text-xs text-warning">{warning}</span>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Actions -->
		<div class="modal-action">
			<button class="btn btn-ghost" onclick={onCancel} disabled={isAssigning}>Cancel</button>
			<button
				class="btn btn-primary"
				onclick={onConfirm}
				disabled={assignments.length === 0 || isAssigning}
			>
				{#if isAssigning}
					<span class="loading loading-spinner loading-sm"></span>
					Assigning...
				{:else}
					Confirm & Assign ({assignments.length})
				{/if}
			</button>
		</div>
	</div>
</div>
