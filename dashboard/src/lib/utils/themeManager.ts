// src/lib/utils/themeManager.ts

/**
 * Centralized theme management utility for Beads Dashboard.
 * Simple theme handling with localStorage persistence.
 */

const DEFAULT_THEME = 'nord';
const THEME_KEY = 'theme';

// All available DaisyUI themes
export const AVAILABLE_THEMES = [
	'light',
	'dark',
	'cupcake',
	'bumblebee',
	'emerald',
	'corporate',
	'synthwave',
	'retro',
	'cyberpunk',
	'valentine',
	'halloween',
	'garden',
	'forest',
	'aqua',
	'lofi',
	'pastel',
	'fantasy',
	'wireframe',
	'black',
	'luxury',
	'dracula',
	'cmyk',
	'autumn',
	'business',
	'acid',
	'lemonade',
	'night',
	'coffee',
	'winter',
	'dim',
	'nord',
	'sunset'
] as const;

export type Theme = (typeof AVAILABLE_THEMES)[number];

/**
 * Get the current theme from DOM or localStorage.
 */
export function getTheme(): string {
	if (typeof document === 'undefined') return DEFAULT_THEME;
	return (
		document.documentElement.getAttribute('data-theme') ||
		localStorage.getItem(THEME_KEY) ||
		DEFAULT_THEME
	);
}

/**
 * Set the theme in DOM and localStorage.
 * @param theme - Theme name from available DaisyUI themes
 */
export function setTheme(theme: string) {
	if (typeof document === 'undefined') return;

	// Validate theme is available
	if (!AVAILABLE_THEMES.includes(theme as Theme)) {
		console.warn(`Invalid theme "${theme}", falling back to default`);
		theme = DEFAULT_THEME;
	}

	document.documentElement.setAttribute('data-theme', theme);
	localStorage.setItem(THEME_KEY, theme);
}

/**
 * Initialize theme on app start.
 */
export function initializeTheme() {
	if (typeof document === 'undefined') return;

	const localTheme = localStorage.getItem(THEME_KEY);
	if (localTheme) {
		setTheme(localTheme);
	} else {
		setTheme(DEFAULT_THEME);
	}
}

/**
 * Check if a theme is valid.
 */
export function isValidTheme(theme: string): theme is Theme {
	return AVAILABLE_THEMES.includes(theme as Theme);
}
