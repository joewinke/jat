<script lang="ts">
	/**
	 * CommandPalette Component
	 * Global command palette with Cmd+K shortcut (Raycast/Spotlight style)
	 *
	 * Features:
	 * - Keyboard shortcut (Cmd+K on Mac, Ctrl+K on Windows/Linux)
	 * - Fuzzy search for actions
	 * - Keyboard navigation (arrow keys, Enter to execute)
	 * - Escape to close
	 * - Common actions: navigate, create, search
	 */

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import TaskCreationDrawer from './TaskCreationDrawer.svelte';

	// Modal state
	let isOpen = $state(false);
	let searchQuery = $state('');
	let selectedIndex = $state(0);
	let searchInput: HTMLInputElement;

	// Drawer state
	let isDrawerOpen = $state(false);

	// Task search state
	let searchMode = $state<'actions' | 'tasks'>('actions'); // 'actions' = command palette, 'tasks' = task search
	let tasks = $state([]);
	let isLoadingTasks = $state(false);
	let searchDebounceTimer: number;

	// Action registry
	interface Action {
		id: string;
		label: string;
		description: string;
		icon: string;
		keywords: string[];
		execute: () => void;
	}

	const actions: Action[] = [
		{
			id: 'nav-home',
			label: 'Go to Home',
			description: 'View all tasks in list or graph mode',
			icon: '🏠',
			keywords: ['home', 'dashboard', 'tasks', 'list'],
			execute: () => {
				goto('/');
				close();
			}
		},
		{
			id: 'nav-agents',
			label: 'Go to Agents',
			description: 'View agent coordination and task assignment',
			icon: '👥',
			keywords: ['agents', 'team', 'coordination', 'assign'],
			execute: () => {
				goto('/agents');
				close();
			}
		},
		{
			id: 'nav-api-demo',
			label: 'Go to API Demo',
			description: 'Interactive API testing and exploration',
			icon: '🔌',
			keywords: ['api', 'demo', 'test', 'endpoints'],
			execute: () => {
				goto('/api-demo');
				close();
			}
		},
		{
			id: 'create-task',
			label: 'Create Task',
			description: 'Open task creation drawer',
			icon: '➕',
			keywords: ['create', 'new', 'task', 'add'],
			execute: () => {
				close();
				isDrawerOpen = true;
			}
		},
		{
			id: 'search-tasks',
			label: 'Search Tasks',
			description: 'Search all tasks across projects',
			icon: '🔍',
			keywords: ['search', 'find', 'filter', 'query'],
			execute: () => {
				// Switch to task search mode
				searchMode = 'tasks';
				searchQuery = '';
				selectedIndex = 0;
				tasks = [];
				// Don't close - stay in modal for search
			}
		},
		{
			id: 'toggle-theme',
			label: 'Change Theme',
			description: 'Switch between light and dark themes',
			icon: '🎨',
			keywords: ['theme', 'dark', 'light', 'appearance', 'style'],
			execute: () => {
				// Focus theme selector
				const themeBtn = document.querySelector('[aria-label="Change Theme"]');
				if (themeBtn instanceof HTMLElement) {
					themeBtn.click();
				}
				close();
			}
		},
		{
			id: 'refresh-data',
			label: 'Refresh Data',
			description: 'Reload current page data',
			icon: '🔄',
			keywords: ['refresh', 'reload', 'update', 'sync'],
			execute: () => {
				window.location.reload();
				close();
			}
		}
	];

	// Fuzzy search function
	function fuzzyMatch(query: string, text: string): boolean {
		const normalizedQuery = query.toLowerCase();
		const normalizedText = text.toLowerCase();

		// Simple substring match for now
		if (normalizedText.includes(normalizedQuery)) {
			return true;
		}

		// Check keywords
		return false;
	}

	function searchActions(query: string): Action[] {
		if (!query.trim()) {
			return actions;
		}

		return actions.filter((action) => {
			// Check label
			if (fuzzyMatch(query, action.label)) {
				return true;
			}

			// Check description
			if (fuzzyMatch(query, action.description)) {
				return true;
			}

			// Check keywords
			return action.keywords.some((keyword) => fuzzyMatch(query, keyword));
		});
	}

	// Filtered actions based on search
	const filteredActions = $derived(searchActions(searchQuery));

	// Task search function with debouncing
	async function searchTasks(query: string) {
		// Clear existing timer
		if (searchDebounceTimer) {
			clearTimeout(searchDebounceTimer);
		}

		// If query is empty, clear tasks
		if (!query.trim()) {
			tasks = [];
			isLoadingTasks = false;
			return;
		}

		// Set loading state
		isLoadingTasks = true;

		// Debounce API call (300ms)
		searchDebounceTimer = setTimeout(async () => {
			try {
				const response = await fetch(`/api/tasks?search=${encodeURIComponent(query)}`);
				const data = await response.json();
				tasks = data.tasks || [];
			} catch (error) {
				console.error('Task search error:', error);
				tasks = [];
			} finally {
				isLoadingTasks = false;
			}
		}, 300) as unknown as number;
	}

	// Trigger task search when query changes (only in task mode)
	$effect(() => {
		if (searchMode === 'tasks' && searchQuery) {
			searchTasks(searchQuery);
		}
	});

	// Open/close functions
	function open() {
		isOpen = true;
		searchQuery = '';
		selectedIndex = 0;
		searchMode = 'actions'; // Reset to actions mode
		tasks = [];
		isLoadingTasks = false;

		// Focus input after modal opens
		setTimeout(() => {
			searchInput?.focus();
		}, 50);
	}

	function close() {
		isOpen = false;
		searchQuery = '';
		selectedIndex = 0;
		searchMode = 'actions'; // Reset to actions mode
		tasks = [];
		isLoadingTasks = false;

		// Clear any pending search timers
		if (searchDebounceTimer) {
			clearTimeout(searchDebounceTimer);
		}
	}

	// Keyboard navigation
	function handleKeyDown(e: KeyboardEvent) {
		if (!isOpen) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, filteredActions.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, 0);
				break;
			case 'Enter':
				e.preventDefault();
				if (filteredActions[selectedIndex]) {
					filteredActions[selectedIndex].execute();
				}
				break;
			case 'Escape':
				e.preventDefault();
				close();
				break;
		}
	}

	// Global keyboard shortcut listener
	onMount(() => {
		function handleGlobalKeyDown(e: KeyboardEvent) {
			// Cmd+K on Mac, Ctrl+K on Windows/Linux
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				if (isOpen) {
					close();
				} else {
					open();
				}
			}
		}

		window.addEventListener('keydown', handleGlobalKeyDown);

		return () => {
			window.removeEventListener('keydown', handleGlobalKeyDown);
		};
	});

	// Reset selected index when query changes
	$effect(() => {
		if (searchQuery) {
			selectedIndex = 0;
		}
	});

	// Handle task creation success
	function handleTaskCreated(task: any) {
		console.log('Task created:', task);
		// Could navigate to the task or refresh data here
		// For now, just log it
	}
</script>

<!-- Modal -->
{#if isOpen}
	<div class="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="command-palette-title">
		<!-- Backdrop -->
		<div
			class="modal-backdrop bg-base-300/80"
			role="button"
			tabindex="-1"
			onclick={close}
			onkeydown={(e) => e.key === 'Enter' && close()}
		></div>

		<!-- Command palette -->
		<div class="modal-box max-w-2xl p-0 overflow-hidden">
			<!-- Search input -->
			<div class="p-4 border-b border-base-300">
				<div class="flex items-center gap-3">
					<span class="text-2xl">🔍</span>
					<input
						bind:this={searchInput}
						bind:value={searchQuery}
						onkeydown={handleKeyDown}
						type="text"
						placeholder="Search actions..."
						class="input input-ghost w-full focus:outline-none text-lg"
						autocomplete="off"
						aria-label="Search command palette"
					/>
					<kbd class="kbd kbd-sm">ESC</kbd>
				</div>
			</div>

			<!-- Actions list -->
			<div class="max-h-96 overflow-y-auto">
				{#if filteredActions.length === 0}
					<div class="p-8 text-center text-base-content/50">
						<p class="text-lg mb-2">No actions found</p>
						<p class="text-sm">Try different search terms</p>
					</div>
				{:else}
					<ul class="menu p-2">
						{#each filteredActions as action, index}
							<li>
								<button
									type="button"
									class="flex items-start gap-3 p-3 rounded-lg {index === selectedIndex
										? 'bg-primary text-primary-content'
										: ''}"
									onclick={() => action.execute()}
									onmouseenter={() => (selectedIndex = index)}
								>
									<span class="text-2xl flex-shrink-0">{action.icon}</span>
									<div class="flex-1 text-left">
										<div class="font-medium">{action.label}</div>
										<div
											class="text-sm opacity-70 {index === selectedIndex
												? 'text-primary-content/70'
												: 'text-base-content/70'}"
										>
											{action.description}
										</div>
									</div>
									{#if index === selectedIndex}
										<kbd class="kbd kbd-sm">↵</kbd>
									{/if}
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<!-- Footer with keyboard hints -->
			<div class="p-3 border-t border-base-300 bg-base-200 flex items-center justify-between text-xs">
				<div class="flex gap-4">
					<div class="flex items-center gap-1">
						<kbd class="kbd kbd-xs">↑</kbd>
						<kbd class="kbd kbd-xs">↓</kbd>
						<span class="text-base-content/70">Navigate</span>
					</div>
					<div class="flex items-center gap-1">
						<kbd class="kbd kbd-xs">↵</kbd>
						<span class="text-base-content/70">Select</span>
					</div>
					<div class="flex items-center gap-1">
						<kbd class="kbd kbd-xs">ESC</kbd>
						<span class="text-base-content/70">Close</span>
					</div>
				</div>
				<div class="flex items-center gap-1">
					<kbd class="kbd kbd-xs">⌘</kbd>
					<span class="text-base-content/70">+</span>
					<kbd class="kbd kbd-xs">K</kbd>
					<span class="text-base-content/70 ml-1">to open</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Task Creation Drawer -->
<TaskCreationDrawer bind:isOpen={isDrawerOpen} onTaskCreated={handleTaskCreated} />
