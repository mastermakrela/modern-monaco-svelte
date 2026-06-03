import { MediaQuery } from 'svelte/reactivity';

/** Default dark theme (ships bundled with modern-monaco). */
export const DEFAULT_DARK_THEME = 'vitesse-dark';
/** Default light theme (loaded from the CDN at init). */
export const DEFAULT_LIGHT_THEME = 'vitesse-light';

let prefersDark: MediaQuery | undefined;

/**
 * Reactive: whether the system currently prefers a dark color scheme.
 * Read it inside `$derived`/`$effect` to track live changes; on the server
 * it reports dark (matching modern-monaco's bundled default theme).
 */
export function systemPrefersDark(): boolean {
	prefersDark ??= new MediaQuery('(prefers-color-scheme: dark)', true);
	return prefersDark.current;
}

/**
 * Resolves the theme to apply: an explicit `theme` wins; otherwise the
 * light/dark pair is picked by `dark` when provided, falling back to the
 * system's `prefers-color-scheme` (reactive — resolve inside
 * `$derived`/`$effect` to follow live changes).
 *
 * Pass `dark` to drive the color scheme from your own source (e.g.
 * mode-watcher, a user toggle) instead of `prefers-color-scheme`.
 */
export function resolveTheme(
	explicit: string | undefined,
	themeLight: string,
	themeDark: string,
	dark?: boolean
): string {
	if (explicit) return explicit;
	return (dark ?? systemPrefersDark()) ? themeDark : themeLight;
}
