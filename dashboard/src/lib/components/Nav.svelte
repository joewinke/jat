<script lang="ts">
	/**
	 * Nav Component - Unified navigation bar for all dashboard pages
	 *
	 * Simplified to be page-agnostic:
	 * - No context-based configuration
	 * - Imports navItems from navConfig.ts
	 * - Page detection via $page.url.pathname
	 * - Active state based on current route
	 * - Always shows ProjectSelector and ThemeSelector
	 * - No view toggle (nav items replace this)
	 *
	 * Props:
	 * - projects: string[] (for project dropdown)
	 * - selectedProject: string (current project selection)
	 * - onProjectChange: (project: string) => void
	 * - taskCounts: Map<string, number> (optional task counts per project)
	 */

	import { page } from '$app/stores';
	import { unifiedNavConfig } from '$lib/config/navConfig';
	import ThemeSelector from './ThemeSelector.svelte';
	import ProjectSelector from './ProjectSelector.svelte';
	import UserProfile from './UserProfile.svelte';
	import ClaudeUsageBar from './ClaudeUsageBar.svelte';

	interface Props {
		projects?: string[];
		selectedProject?: string;
		onProjectChange?: (project: string) => void;
		taskCounts?: Map<string, number> | null;
	}

	let {
		projects = [],
		selectedProject = 'All Projects',
		onProjectChange = () => {},
		taskCounts = null
	}: Props = $props();

	// Get current pathname for active state detection
	const currentPath = $derived($page.url.pathname);

	// Helper to check if nav item is active
	function isActive(href: string): boolean {
		// Exact match for home
		if (href === '/' && currentPath === '/') {
			return true;
		}
		// Prefix match for other routes
		if (href !== '/' && currentPath.startsWith(href)) {
			return true;
		}
		return false;
	}

	// Icon SVG paths (same as before)
	const icons: Record<string, string> = {
		list: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z',
		graph: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
		users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z'
	};
</script>

<div class="navbar bg-base-100 border-b border-base-300">
	<!-- Left: Navigation Items (flex-nowrap prevents wrapping) -->
	<div class="flex-1">
		<div class="flex flex-nowrap items-center gap-1.5">
			<!-- Render nav items from config -->
			{#each unifiedNavConfig.navItems as navItem}
				<a
					href={navItem.href}
					class="btn btn-sm {isActive(navItem.href) ? 'btn-primary' : 'btn-ghost'}"
					aria-label={navItem.label}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-4 h-4"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d={icons[navItem.icon]} />
					</svg>
					<span class="hidden lg:inline ml-1">{navItem.label}</span>
				</a>
			{/each}
		</div>
	</div>

	<!-- Right: Controls (flex-nowrap prevents wrapping) -->
	<div class="flex-none flex flex-nowrap items-center gap-1.5">
		<!-- Project Filter (always show if projects available) -->
		{#if unifiedNavConfig.showProjectFilter && projects.length > 0}
			<div class="w-36 sm:w-40 md:w-48">
				<ProjectSelector
					{projects}
					{selectedProject}
					{onProjectChange}
					{taskCounts}
					compact={true}
				/>
			</div>
		{/if}

		<!-- Theme Selector (always show) -->
		{#if unifiedNavConfig.showThemeSelector}
			<ThemeSelector />
		{/if}

		<!-- Claude Usage Bar -->
		<ClaudeUsageBar />

		<!-- User Profile -->
		<UserProfile />
	</div>
</div>
