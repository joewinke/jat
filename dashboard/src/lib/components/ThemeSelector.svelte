<script lang="ts">
	/**
	 * ThemeSelector Component
	 * Supports all 32 DaisyUI themes with localStorage persistence
	 */

	import { onMount } from 'svelte';
	import { setTheme } from '$lib/utils/themeManager';

	// All DaisyUI themes with labels
	const themes = [
		{ name: 'light', label: 'Light' },
		{ name: 'dark', label: 'Dark' },
		{ name: 'cupcake', label: 'Cupcake' },
		{ name: 'bumblebee', label: 'Bumblebee' },
		{ name: 'emerald', label: 'Emerald' },
		{ name: 'corporate', label: 'Corporate' },
		{ name: 'synthwave', label: 'Synthwave' },
		{ name: 'retro', label: 'Retro' },
		{ name: 'cyberpunk', label: 'Cyberpunk' },
		{ name: 'valentine', label: 'Valentine' },
		{ name: 'halloween', label: 'Halloween' },
		{ name: 'garden', label: 'Garden' },
		{ name: 'forest', label: 'Forest' },
		{ name: 'aqua', label: 'Aqua' },
		{ name: 'lofi', label: 'Lofi' },
		{ name: 'pastel', label: 'Pastel' },
		{ name: 'fantasy', label: 'Fantasy' },
		{ name: 'wireframe', label: 'Wireframe' },
		{ name: 'black', label: 'Black' },
		{ name: 'luxury', label: 'Luxury' },
		{ name: 'dracula', label: 'Dracula' },
		{ name: 'cmyk', label: 'CMYK' },
		{ name: 'autumn', label: 'Autumn' },
		{ name: 'business', label: 'Business' },
		{ name: 'acid', label: 'Acid' },
		{ name: 'lemonade', label: 'Lemonade' },
		{ name: 'night', label: 'Night' },
		{ name: 'coffee', label: 'Coffee' },
		{ name: 'winter', label: 'Winter' },
		{ name: 'dim', label: 'Dim' },
		{ name: 'nord', label: 'Nord' },
		{ name: 'sunset', label: 'Sunset' }
	];

	let currentTheme = $state('nord');

	// Get display label for current theme
	const currentThemeLabel = $derived(
		themes.find((t) => t.name === currentTheme)?.label || 'Nord'
	);

	onMount(() => {
		// Get current theme or default to nord
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme && themes.some((t) => t.name === savedTheme)) {
			currentTheme = savedTheme;
			document.documentElement.setAttribute('data-theme', savedTheme);
		} else {
			currentTheme = 'nord';
			document.documentElement.setAttribute('data-theme', 'nord');
			localStorage.setItem('theme', 'nord');
		}
	});

	function handleThemeChange(themeName: string) {
		currentTheme = themeName;
		setTheme(themeName);
	}
</script>

<div class="dropdown dropdown-end">
	<div
		tabindex="0"
		role="button"
		class="flex items-center gap-2 cursor-pointer hover:bg-base-300 transition-colors px-2 py-1 rounded"
		aria-label="Change Theme"
		title="Change Theme"
	>
		<!-- Theme color preview blocks -->
		<div
			data-theme={currentTheme}
			class="bg-base-100 grid shrink-0 grid-cols-2 gap-0.5 rounded p-0.5 shadow-sm w-4 h-4"
		>
			<div class="bg-base-content size-1 rounded-full"></div>
			<div class="bg-primary size-1 rounded-full"></div>
			<div class="bg-secondary size-1 rounded-full"></div>
			<div class="bg-accent size-1 rounded-full"></div>
		</div>
		<span class="text-sm font-medium">{currentThemeLabel}</span>
	</div>

	<div
		class="dropdown-content bg-base-200 text-base-content rounded-box
    top-px max-h-[calc(50vh-6.5rem)] overflow-y-auto border border-white/5
    shadow-2xl outline-1 outline-black/5 mb-2"
	>
		<ul class="menu w-56">
			<li class="menu-title text-xs">Theme</li>

			{#each themes as theme}
				<li>
					<button
						class="gap-3 px-2"
						onclick={() => handleThemeChange(theme.name)}
						class:active={currentTheme === theme.name}
					>
						<!-- Theme color preview -->
						<div
							data-theme={theme.name}
							class="bg-base-100 grid shrink-0 grid-cols-2 gap-0.5
              rounded-md p-1 shadow-sm"
						>
							<div class="bg-base-content size-1 rounded-full"></div>
							<div class="bg-primary size-1 rounded-full"></div>
							<div class="bg-secondary size-1 rounded-full"></div>
							<div class="bg-accent size-1 rounded-full"></div>
						</div>

						<div class="w-32 truncate">{theme.label}</div>

						<!-- Checkmark for active theme -->
						{#if currentTheme === theme.name}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="h-3 w-3 shrink-0"
							>
								<path
									d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716
                9 8.728 15-15.285z"
								></path>
							</svg>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="currentColor"
								class="invisible h-3 w-3 shrink-0"
							>
								<path
									d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716
                9 8.728 15-15.285z"
								></path>
							</svg>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	</div>
</div>
