<script lang="ts">
	import { formatHours } from '$lib/utils/capacityCalculations';

	/**
	 * Reusable capacity visualization component with color-coded bar and tooltip
	 */
	let {
		usedHours = 0,
		availableHours = 8,
		percentage = 0,
		status = 'good',
		showLabel = true,
		size = 'md', // 'sm', 'md', 'lg'
		tasksBreakdown = []
	} = $props();

	let showTooltip = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	// Get color classes based on status
	const statusColors = {
		good: 'bg-success',
		moderate: 'bg-warning',
		high: 'bg-error'
	};

	const statusTextColors = {
		good: 'text-success',
		moderate: 'text-warning',
		high: 'text-error'
	};

	// Size classes
	const sizeClasses = {
		sm: 'h-1.5',
		md: 'h-2',
		lg: 'h-3'
	};

	function handleMouseEnter(event) {
		showTooltip = true;
		updateTooltipPosition(event);
	}

	function handleMouseMove(event) {
		if (showTooltip) {
			updateTooltipPosition(event);
		}
	}

	function handleMouseLeave() {
		showTooltip = false;
	}

	function updateTooltipPosition(event) {
		tooltipX = event.clientX;
		tooltipY = event.clientY;
	}
</script>

<div class="capacity-bar-container">
	{#if showLabel}
		<div class="flex items-center justify-between text-xs mb-1">
			<span class="font-medium text-base-content/70">
				Capacity: {formatHours(usedHours)} / {formatHours(availableHours)}
			</span>
			<span class="font-medium {statusTextColors[status]}">
				{Math.round(percentage)}%
			</span>
		</div>
	{/if}

	<div
		class="relative w-full bg-base-300 rounded-full {sizeClasses[size]} cursor-help"
		onmouseenter={handleMouseEnter}
		onmousemove={handleMouseMove}
		onmouseleave={handleMouseLeave}
		role="progressbar"
		aria-valuenow={percentage}
		aria-valuemin={0}
		aria-valuemax={100}
	>
		<div
			class="{sizeClasses[size]} rounded-full transition-all duration-300 {statusColors[status]}"
			style="width: {percentage}%"
		></div>
	</div>

	<!-- Tooltip -->
	{#if showTooltip && tasksBreakdown.length > 0}
		<div
			class="fixed z-50 pointer-events-none"
			style="left: {tooltipX + 10}px; top: {tooltipY + 10}px;"
		>
			<div class="bg-base-100 border-2 border-base-300 rounded-lg shadow-xl p-3 max-w-sm">
				<div class="space-y-2">
					<!-- Summary -->
					<div class="flex items-center justify-between gap-4 pb-2 border-b border-base-300">
						<div>
							<div class="text-sm font-semibold text-base-content">
								Capacity Breakdown
							</div>
							<div class="text-xs text-base-content/70">
								{formatHours(usedHours)} of {formatHours(availableHours)} used
							</div>
						</div>
						<div class="text-right">
							<div class="text-lg font-bold {statusTextColors[status]}">
								{Math.round(percentage)}%
							</div>
							<div class="text-xs uppercase font-medium {statusTextColors[status]}">
								{status}
							</div>
						</div>
					</div>

					<!-- Tasks List -->
					{#if tasksBreakdown.length > 0}
						<div class="space-y-1 max-h-64 overflow-y-auto">
							<div class="text-xs font-medium text-base-content/70 mb-1">
								Queued Tasks ({tasksBreakdown.length}):
							</div>
							{#each tasksBreakdown as task}
								<div class="flex items-start justify-between gap-2 text-xs bg-base-200 rounded px-2 py-1">
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-1">
											<span class="badge badge-xs badge-primary">P{task.priority}</span>
											<span class="truncate text-base-content/90" title={task.title}>
												{task.title}
											</span>
										</div>
										<div class="text-base-content/50 font-mono text-xs truncate" title={task.taskId}>
											{task.taskId}
										</div>
									</div>
									<span class="text-base-content/70 font-medium whitespace-nowrap">
										{formatHours(task.estimatedHours)}
									</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.capacity-bar-container {
		position: relative;
	}
</style>
