import { describe, expect, it } from 'vitest';
import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, resolveTheme } from '../../lib/theme.svelte.js';

describe('resolveTheme', () => {
	it('lets an explicit theme win', () => {
		expect(resolveTheme('rose-pine', DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME)).toBe('rose-pine');
	});

	it('falls back to the dark theme on the server (no matchMedia)', () => {
		// node environment: MediaQuery reports the SSR fallback (dark)
		expect(resolveTheme(undefined, DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME)).toBe(
			DEFAULT_DARK_THEME
		);
	});
});
