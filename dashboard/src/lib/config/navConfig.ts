/**
 * Navigation Configuration
 * Unified config for dashboard navigation (replaces page-specific configs)
 */

export interface NavItem {
	id: string; // Unique identifier (e.g., 'list', 'graph', 'agents')
	label: string; // Display text (e.g., 'List', 'Graph', 'Agents')
	href: string; // Navigation target (e.g., '/', '/agents')
	icon: string; // Icon identifier (matches icon SVG paths in Nav.svelte)
}

export interface UnifiedNavConfig {
	navItems: NavItem[]; // All navigation items (rendered as buttons in nav bar)
	showProjectFilter: boolean; // Show project selector dropdown
	showThemeSelector: boolean; // Show theme picker
}

/**
 * Unified Navigation Configuration
 *
 * Defines all navigation items and global nav settings.
 * Nav component imports this and renders nav items as buttons with active state.
 * Page-specific logic removed - Nav is now agnostic to which page it's on.
 */
export const unifiedNavConfig: UnifiedNavConfig = {
	navItems: [
		{
			id: 'list',
			label: 'List',
			href: '/',
			icon: 'list'
		},
		{
			id: 'graph',
			label: 'Graph',
			href: '/?view=graph',
			icon: 'graph'
		},
		{
			id: 'agents',
			label: 'Agents',
			href: '/agents',
			icon: 'users'
		}
	],
	showProjectFilter: true,
	showThemeSelector: true
};
