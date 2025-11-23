<script lang="ts">
	/**
	 * Sidebar Component - Vertical navigation using DaisyUI drawer sidebar pattern
	 *
	 * Features:
	 * - Vertical nav menu with 5 main routes (List, Dependency, Timeline, Kanban, Agents)
	 * - Active state highlighting based on current route
	 * - Icon + label layout with tooltips when collapsed
	 * - Responsive: Full-width on desktop (lg:drawer-open), collapsible on mobile
	 * - Bottom utilities: Help button, Theme selector
	 * - Smooth transitions between collapsed/open states
	 *
	 * Usage: Place inside drawer-side div in root layout
	 */

	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { unifiedNavConfig } from '$lib/config/navConfig';

	// Helper to check if nav item is active
	function isActive(href: string): boolean {
		const currentPath = $page.url.pathname;
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

	// Navigation handler for button clicks
	function handleNavClick(href: string) {
		goto(href);
	}

	// Icon SVG paths
	const icons: Record<string, string> = {
		list: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z',
		graph: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
		calendar:
			'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
		columns:
			'M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z',
		users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
		help: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
	};

	// Help modal state
	let showHelpModal = $state(false);
	let activeHelpTab = $state('keyboard'); // 'keyboard', 'commands', 'readme'

	function toggleHelp() {
		showHelpModal = !showHelpModal;
	}

	function setHelpTab(tab: string) {
		activeHelpTab = tab;
	}
</script>

<div class="drawer-side is-drawer-close:overflow-visible">
	<!-- Drawer overlay -->
	<label for="main-drawer" aria-label="close sidebar" class="drawer-overlay"></label>

	<!-- Sidebar content -->
	<div class="flex h-screen flex-col bg-base-200 overflow-hidden is-drawer-close:w-14 is-drawer-open:w-64">
		<!-- Main navigation items -->
		<ul class="menu w-full p-2 flex-1 gap-1">
			{#each unifiedNavConfig.navItems as navItem}
				<li>
					<button
						onclick={() => handleNavClick(navItem.href)}
						class="mt-3 is-drawer-close:tooltip is-drawer-close:tooltip-right transition-all duration-200 {isActive(
							navItem.href
						)
							? 'active bg-primary text-primary-content'
							: ''}"
						data-tip={navItem.label}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-5 h-5 flex-shrink-0"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d={icons[navItem.icon]} />
						</svg>
						<span class="is-drawer-close:hidden">{navItem.label}</span>
					</button>
				</li>
			{/each}
		</ul>

		<!-- Bottom utilities -->
		<ul class="menu w-full p-2 gap-1">
			<!-- Help button -->
			<li>
				<button
					class="is-drawer-close:tooltip is-drawer-close:tooltip-right"
					data-tip="Help & Shortcuts"
					onclick={toggleHelp}
					aria-label="Show help guide"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-5 h-5 flex-shrink-0"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d={icons.help} />
					</svg>
					<span class="is-drawer-close:hidden">Help</span>
				</button>
			</li>

		</ul>
	</div>
</div>

<!-- Help Guide Modal -->
{#if showHelpModal}
	<div class="modal modal-open">
		<div class="modal-box max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
			<!-- Header -->
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-2xl font-bold">Help & Reference</h3>
				<button
					class="btn btn-sm btn-circle btn-ghost"
					onclick={toggleHelp}
					aria-label="Close help"
				>
					✕
				</button>
			</div>

			<!-- Tabs -->
			<div role="tablist" class="tabs tabs-lifted mb-4">
				<button
					role="tab"
					class="tab {activeHelpTab === 'commands' ? 'tab-active' : ''}"
					onclick={() => setHelpTab('commands')}
				>
					Agent Commands
				</button>
				<button
					role="tab"
					class="tab {activeHelpTab === 'keyboard' ? 'tab-active' : ''}"
					onclick={() => setHelpTab('keyboard')}
				>
					Keyboard Shortcuts
				</button>
				<button
					role="tab"
					class="tab {activeHelpTab === 'readme' ? 'tab-active' : ''}"
					onclick={() => setHelpTab('readme')}
				>
					README
				</button>
			</div>

			<!-- Tab Content (scrollable) -->
			<div class="flex-1 overflow-y-auto">
				<!-- Agent Commands Tab -->
				{#if activeHelpTab === 'commands'}
					<div class="space-y-6">
						<div class="alert alert-info">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								class="stroke-current shrink-0 w-5 h-5"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
							<span class="text-sm"
								>7 commands for multi-agent orchestration. See full docs in COMMANDS.md</span
							>
						</div>

						<!-- Core Workflow Commands -->
						<div>
							<h4 class="text-lg font-semibold mb-3">Core Workflow (4 commands)</h4>

							<!-- /agent:start -->
							<div class="mb-4">
								<h5 class="text-md font-semibold mb-2">/agent:start - Get to Work</h5>
								<div class="mockup-code text-xs mb-2">
									<pre><code>/agent:start                    # Auto-create new agent (fast!)</code></pre>
									<pre><code>/agent:start resume             # Choose from logged-out agents</code></pre>
									<pre><code>/agent:start GreatWind          # Resume specific agent by name</code></pre>
									<pre><code>/agent:start quick              # Start highest priority task immediately</code></pre>
									<pre><code>/agent:start task-abc           # Start specific task (with checks)</code></pre>
									<pre><code>/agent:start task-abc quick     # Start specific task (skip checks)</code></pre>
								</div>
								<p class="text-sm text-base-content/70">
									Smart registration (auto-create or resume) → Session persistence → Task selection
									→ Conflict detection → Actually starts work
								</p>
							</div>

							<!-- /agent:next -->
							<div class="mb-4">
								<h5 class="text-md font-semibold mb-2">/agent:next - Drive Mode (Auto-Continue)</h5>
								<div class="mockup-code text-xs mb-2">
									<pre><code>/agent:next                     # Full verify + commit + auto-start next</code></pre>
									<pre><code>/agent:next quick               # Quick commit + auto-start next (skip verify)</code></pre>
								</div>
								<p class="text-sm text-base-content/70">
									Verify → Commit → Acknowledge Mail → Announce → Mark complete → Release locks →
									Auto-start next task (continuous flow)
								</p>
							</div>

							<!-- /agent:complete -->
							<div class="mb-4">
								<h5 class="text-md font-semibold mb-2">
									/agent:complete - Finish Properly (Manual Selection)
								</h5>
								<div class="mockup-code text-xs mb-2">
									<pre><code>/agent:complete                 # Full verify + show menu + recommended next</code></pre>
								</div>
								<p class="text-sm text-base-content/70">
									Same as /agent:next but shows available tasks menu instead of auto-continuing. Use
									when you want to choose next task manually.
								</p>
							</div>

							<!-- /agent:pause -->
							<div class="mb-4">
								<h5 class="text-md font-semibold mb-2">
									/agent:pause - Quick Pivot (Context Switch)
								</h5>
								<div class="mockup-code text-xs mb-2">
									<pre><code>/agent:pause                    # Quick exit + show menu</code></pre>
								</div>
								<p class="text-sm text-base-content/70">
									Quick commit/stash → Acknowledge Mail → Release locks → Show available tasks menu.
									Use for emergency exit or context switch.
								</p>
							</div>
						</div>

						<!-- Support Commands -->
						<div>
							<h4 class="text-lg font-semibold mb-3">Support Commands (3 commands)</h4>

							<!-- /agent:status -->
							<div class="mb-4">
								<h5 class="text-md font-semibold mb-2">/agent:status - Check Current Work</h5>
								<div class="mockup-code text-xs mb-2">
									<pre><code>/agent:status                   # Shows current task, locks, messages</code></pre>
								</div>
								<p class="text-sm text-base-content/70">
									Shows current task progress, active file reservations, unread Agent Mail messages,
									and team sync.
								</p>
							</div>

							<!-- /agent:verify -->
							<div class="mb-4">
								<h5 class="text-md font-semibold mb-2">/agent:verify - Quality Checks</h5>
								<div class="mockup-code text-xs mb-2">
									<pre><code>/agent:verify                   # Verify current task</code></pre>
									<pre><code>/agent:verify task-abc          # Verify specific task</code></pre>
								</div>
								<p class="text-sm text-base-content/70">
									Runs tests, lint, security checks, and browser tests (if applicable). Must pass
									before /agent:complete.
								</p>
							</div>

							<!-- /agent:plan -->
							<div class="mb-4">
								<h5 class="text-md font-semibold mb-2">
									/agent:plan - Convert Planning to Tasks
								</h5>
								<div class="mockup-code text-xs mb-2">
									<pre><code>/agent:plan                     # Analyze conversation/PRD, create tasks</code></pre>
								</div>
								<p class="text-sm text-base-content/70">
									Analyzes conversation history OR written PRD, breaks work into atomic tasks,
									creates Beads tasks with proper dependency chains.
								</p>
							</div>
						</div>

						<!-- Quick Tips -->
						<div>
							<h4 class="text-lg font-semibold mb-3">Quick Tips</h4>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div class="alert alert-success">
									<span class="text-sm"
										><strong>Speed:</strong> Use `/agent:start quick` and `/agent:next quick` for rapid
										iteration</span
									>
								</div>
								<div class="alert alert-info">
									<span class="text-sm"
										><strong>Control:</strong> Use `/agent:complete` when you want to choose next task
										manually</span
									>
								</div>
								<div class="alert alert-warning">
									<span class="text-sm"
										><strong>Quality:</strong> Always run `/agent:verify` before `/agent:complete` for
										critical work</span
									>
								</div>
								<div class="alert">
									<span class="text-sm"
										><strong>Coordination:</strong> All commands acknowledge Agent Mail and announce
										completion</span
									>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Keyboard Shortcuts Tab -->
				{#if activeHelpTab === 'keyboard'}
					<div class="space-y-6">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<!-- Global Shortcuts -->
							<div>
								<h4 class="text-lg font-semibold mb-3 flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									Global
								</h4>
								<div class="space-y-2">
									<div class="flex justify-between items-center">
										<span class="text-sm">Open command palette</span>
										<span class="flex gap-1">
											<kbd class="kbd kbd-sm">Cmd</kbd>
											<span>+</span>
											<kbd class="kbd kbd-sm">K</kbd>
										</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-sm">Show help guide</span>
										<span class="flex gap-1">
											<kbd class="kbd kbd-sm">Ctrl</kbd>
											<span>+</span>
											<kbd class="kbd kbd-sm">/</kbd>
										</span>
									</div>
								</div>
							</div>

							<!-- Task Drawer Shortcuts -->
							<div>
								<h4 class="text-lg font-semibold mb-3 flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									Task Drawer
								</h4>
								<div class="space-y-2">
									<div class="flex justify-between items-center">
										<span class="text-sm">Close drawer</span>
										<kbd class="kbd kbd-sm">Esc</kbd>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-sm">Toggle edit mode</span>
										<kbd class="kbd kbd-sm">E</kbd>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-sm">Mark complete</span>
										<kbd class="kbd kbd-sm">M</kbd>
									</div>
								</div>
							</div>

							<!-- Navigation Shortcuts -->
							<div>
								<h4 class="text-lg font-semibold mb-3 flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 10V3L4 14h7v7l9-11h-7z"
										/>
									</svg>
									Navigation
								</h4>
								<div class="space-y-2">
									<div class="flex justify-between items-center">
										<span class="text-sm">Go to List view</span>
										<kbd class="kbd kbd-sm">G</kbd>
										<span>then</span>
										<kbd class="kbd kbd-sm">L</kbd>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-sm">Go to Agents view</span>
										<kbd class="kbd kbd-sm">G</kbd>
										<span>then</span>
										<kbd class="kbd kbd-sm">A</kbd>
									</div>
								</div>
							</div>

							<!-- Status Indicators -->
							<div>
								<h4 class="text-lg font-semibold mb-3 flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
										/>
									</svg>
									Status Indicators
								</h4>
								<div class="space-y-2">
									<div class="flex justify-between items-center">
										<span class="text-sm">Open</span>
										<span class="badge badge-info">open</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-sm">In Progress</span>
										<span class="badge badge-warning">in_progress</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-sm">Blocked</span>
										<span class="badge badge-error">blocked</span>
									</div>
									<div class="flex justify-between items-center">
										<span class="text-sm">Closed</span>
										<span class="badge badge-success">closed</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Divider -->
						<div class="divider my-6"></div>

						<!-- Tips Section -->
						<div>
							<h4 class="text-lg font-semibold mb-3">Tips</h4>
							<div class="space-y-2">
								<div class="alert alert-info">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										class="stroke-current shrink-0 w-5 h-5"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
									<span class="text-sm"
										>Use <kbd class="kbd kbd-sm">Cmd+K</kbd> to quickly navigate, search tasks, and
										perform actions.</span
									>
								</div>
								<div class="alert alert-info">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										class="stroke-current shrink-0 w-5 h-5"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
									<span class="text-sm"
										>Click any task card to open details. Press <kbd class="kbd kbd-sm">?</kbd> inside
										the drawer for more shortcuts.</span
									>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- README Tab -->
				{#if activeHelpTab === 'readme'}
					<div class="space-y-6">
						<!-- Quick Start -->
						<div>
							<h4 class="text-lg font-semibold mb-3">Quick Start</h4>
							<div class="mockup-code text-xs">
								<pre><code># 1. Install (run in your terminal/bash)</code></pre>
								<pre><code>curl -fsSL https://raw.githubusercontent.com/joewinke/jat/main/install.sh | bash</code></pre>
								<pre><code></code></pre>
								<pre><code># 2. Initialize Beads in your project</code></pre>
								<pre><code>bd init</code></pre>
								<pre><code></code></pre>
								<pre><code># 3. Start working (registers agent + picks task)</code></pre>
								<pre><code>/agent:start</code></pre>
							</div>
						</div>

						<!-- What Is This -->
						<div>
							<h4 class="text-lg font-semibold mb-3">What Is JAT?</h4>
							<p class="text-sm text-base-content/70 mb-3">
								Jomarchy Agent Tools is a <strong>self-contained AI development environment</strong> that
								gives your AI coding assistants (Claude Code, Cline, Codex, etc.) the ability to:
							</p>
							<ul class="list-disc list-inside text-sm text-base-content/70 space-y-1">
								<li>
									<strong>Command</strong> agent swarms with high-level coordination primitives
								</li>
								<li>
									<strong>Coordinate</strong> across multiple agents without conflicts (Agent Mail messaging
									+ file locks)
								</li>
								<li>
									<strong>Transcend</strong> project folders and context window bounds with persistent state
								</li>
								<li>
									<strong>Plan</strong> work with dependency-aware task management (Beads)
								</li>
								<li>
									<strong>Execute</strong> with 28 composable bash tools (no HTTP servers, no running daemons)
								</li>
								<li><strong>Scale</strong> infinitely - add agents without coordination overhead</li>
							</ul>
						</div>

						<!-- Architecture -->
						<div>
							<h4 class="text-lg font-semibold mb-3">Architecture</h4>
							<div class="mockup-code text-xs">
								<pre><code>┌─────────────────────────────────────────┐</code></pre>
								<pre><code>│      AI Coding Assistants (Any)         │</code></pre>
								<pre><code>└─────────────┬───────────────────────────┘</code></pre>
								<pre><code>              ▼</code></pre>
								<pre><code>    ┌────────────────────┐</code></pre>
								<pre><code>    │ Coordination Layer │</code></pre>
								<pre><code>    │  7 Slash Commands  │</code></pre>
								<pre><code>    └────────┬───────────┘</code></pre>
								<pre><code>             │</code></pre>
								<pre><code>  ┌──────────┼──────────┐</code></pre>
								<pre><code>  ▼          ▼          ▼</code></pre>
								<pre><code>Agent    Beads    28 Tools</code></pre>
								<pre><code> Mail      CLI     (bash)</code></pre>
							</div>
						</div>

						<!-- Key Features -->
						<div>
							<h4 class="text-lg font-semibold mb-3">Key Features</h4>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div class="alert alert-info">
									<span class="text-sm"
										><strong>Agent Mail:</strong> Multi-agent coordination with messaging + file locks</span
									>
								</div>
								<div class="alert alert-success">
									<span class="text-sm"
										><strong>Beads:</strong> Dependency-aware task planning with CLI</span
									>
								</div>
								<div class="alert alert-warning">
									<span class="text-sm"
										><strong>28 Tools:</strong> Database, browser, monitoring, dev tools</span
									>
								</div>
								<div class="alert">
									<span class="text-sm"
										><strong>Dashboard:</strong> Real-time multi-project task visualization</span
									>
								</div>
							</div>
						</div>

						<!-- Common Workflows -->
						<div>
							<h4 class="text-lg font-semibold mb-3">Common Workflows</h4>

							<h5 class="text-md font-semibold mb-2">Drive Mode (Continuous Flow)</h5>
							<div class="mockup-code text-xs mb-3">
								<pre><code>/agent:start                    # Create agent</code></pre>
								<pre><code>/agent:start task-abc           # Start first task</code></pre>
								<pre><code>/agent:next                     # Complete + auto-start next</code></pre>
								<pre><code>/agent:next                     # Complete + auto-start next</code></pre>
								<pre><code># ... continuous loop, never stops ...</code></pre>
							</div>

							<h5 class="text-md font-semibold mb-2">Manual Mode (Careful Selection)</h5>
							<div class="mockup-code text-xs mb-3">
								<pre><code>/agent:start                    # Create agent</code></pre>
								<pre><code>/agent:start task-abc           # Start task</code></pre>
								<pre><code>/agent:complete                 # Complete + show menu</code></pre>
								<pre><code># Review recommendations...</code></pre>
								<pre><code>/agent:start task-xyz           # Pick manually</code></pre>
							</div>
						</div>

						<!-- Links -->
						<div>
							<h4 class="text-lg font-semibold mb-3">Learn More</h4>
							<div class="flex flex-col gap-2">
								<a
									href="https://github.com/joewinke/jat"
									target="_blank"
									class="btn btn-sm btn-primary"
								>
									GitHub Repository
								</a>
								<a href="/COMMANDS.md" target="_blank" class="btn btn-sm btn-outline">
									Full Command Reference
								</a>
								<a href="/README.md" target="_blank" class="btn btn-sm btn-outline">
									Complete README
								</a>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="modal-action">
				<button class="btn" onclick={toggleHelp}>Close</button>
			</div>
		</div>
	</div>
{/if}
