<script lang="ts">
	/**
	 * Sparkline Component Test Page
	 */
	import { onMount } from 'svelte';
	import Sparkline from '$lib/components/Sparkline.svelte';

	let systemData = $state<any[]>([]);
	let agentData = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			// Fetch system-wide sparkline data
			const systemResponse = await fetch('/api/agents/sparkline?range=24h');
			if (!systemResponse.ok) {
				throw new Error('Failed to fetch system sparkline data');
			}
			const systemResult = await systemResponse.json();
			systemData = systemResult.data;

			// Fetch per-agent sparkline data (RareBrook)
			const agentResponse = await fetch('/api/agents/sparkline?range=24h&agent=RareBrook');
			if (!agentResponse.ok) {
				throw new Error('Failed to fetch agent sparkline data');
			}
			const agentResult = await agentResponse.json();
			agentData = agentResult.data;

			loading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
			loading = false;
		}
	});
</script>

<div class="min-h-screen bg-base-200 p-8">
	<div class="max-w-4xl mx-auto">
		<h1 class="text-3xl font-bold mb-8">Sparkline Component Test</h1>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<span class="loading loading-spinner loading-lg"></span>
			</div>
		{:else if error}
			<div class="alert alert-error">
				<span>{error}</span>
			</div>
		{:else}
			<!-- System-Wide Sparkline -->
			<div class="card bg-base-100 shadow-xl mb-6">
				<div class="card-body">
					<h2 class="card-title">System-Wide Token Usage (24h)</h2>
					<p class="text-sm text-base-content/70 mb-4">
						{systemData.length} data points
					</p>

					<div class="space-y-4">
						<!-- Default size -->
						<div>
							<div class="text-xs font-medium mb-1">Default (40px height)</div>
							<Sparkline data={systemData} />
						</div>

						<!-- Larger size -->
						<div>
							<div class="text-xs font-medium mb-1">Large (60px height)</div>
							<Sparkline data={systemData} height={60} />
						</div>

						<!-- With grid -->
						<div>
							<div class="text-xs font-medium mb-1">With Grid Lines</div>
							<Sparkline data={systemData} showGrid={true} />
						</div>

						<!-- Static color -->
						<div>
							<div class="text-xs font-medium mb-1">Static Color (Primary)</div>
							<Sparkline data={systemData} colorMode="static" />
						</div>
					</div>
				</div>
			</div>

			<!-- Per-Agent Sparkline -->
			<div class="card bg-base-100 shadow-xl mb-6">
				<div class="card-body">
					<h2 class="card-title">RareBrook Token Usage (24h)</h2>
					<p class="text-sm text-base-content/70 mb-4">
						{agentData.length} data points
					</p>

					<div class="space-y-4">
						<!-- Default -->
						<div>
							<div class="text-xs font-medium mb-1">Agent Sparkline</div>
							<Sparkline data={agentData} />
						</div>

						<!-- Fixed width -->
						<div>
							<div class="text-xs font-medium mb-1">Fixed Width (200px)</div>
							<Sparkline data={agentData} width={200} />
						</div>

						<!-- No tooltip -->
						<div>
							<div class="text-xs font-medium mb-1">No Tooltip</div>
							<Sparkline data={agentData} showTooltip={false} />
						</div>
					</div>
				</div>
			</div>

			<!-- Usage Stats -->
			<div class="stats shadow w-full">
				<div class="stat">
					<div class="stat-title">System Data Points</div>
					<div class="stat-value text-2xl">{systemData.length}</div>
					<div class="stat-desc">30-minute buckets</div>
				</div>

				<div class="stat">
					<div class="stat-title">Agent Data Points</div>
					<div class="stat-value text-2xl">{agentData.length}</div>
					<div class="stat-desc">RareBrook</div>
				</div>

				<div class="stat">
					<div class="stat-title">Total System Tokens</div>
					<div class="stat-value text-2xl">
						{(systemData.reduce((sum, d) => sum + d.tokens, 0) / 1_000_000_000).toFixed(1)}B
					</div>
					<div class="stat-desc">Last 24 hours</div>
				</div>
			</div>
		{/if}
	</div>
</div>
