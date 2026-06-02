import type { InitOptions, Monaco } from './types.js';

let monacoPromise: Promise<Monaco> | null = null;
let pendingOptions: InitOptions[] = [];
let applied: {
	themes: Set<string>;
	langs: Set<string>;
	options: InitOptions;
} | null = null;

/**
 * Merges init options from multiple callers. `themes` and `langs` are
 * concatenated (string entries deduplicated); for everything else the last
 * defined value wins.
 */
export function mergeInitOptions(list: InitOptions[]): InitOptions {
	const merged: InitOptions = {};
	const themes: NonNullable<InitOptions['themes']> = [];
	const langs: NonNullable<InitOptions['langs']> = [];
	const seenThemes = new Set<string>();
	const seenLangs = new Set<string>();

	for (const options of list) {
		for (const theme of options.themes ?? []) {
			const key = stringKey(theme);
			if (key !== null) {
				if (seenThemes.has(key)) continue;
				seenThemes.add(key);
			}
			themes.push(theme);
		}
		for (const lang of options.langs ?? []) {
			const key = stringKey(lang);
			if (key !== null) {
				if (seenLangs.has(key)) continue;
				seenLangs.add(key);
			}
			langs.push(lang);
		}
		if (options.defaultTheme !== undefined) merged.defaultTheme = options.defaultTheme;
		if (options.cdn !== undefined) merged.cdn = options.cdn;
		if (options.workspace !== undefined) merged.workspace = options.workspace;
		if (options.lsp !== undefined) merged.lsp = options.lsp;
	}

	if (themes.length > 0) merged.themes = themes;
	if (langs.length > 0) merged.langs = langs;
	return merged;
}

function stringKey(input: unknown): string | null {
	return typeof input === 'string' || input instanceof URL ? input.toString() : null;
}

/** Whether `options` asks for anything beyond what init already registered. */
function hasLateAdditions(options: InitOptions): boolean {
	if (!applied) return true;
	for (const theme of options.themes ?? []) {
		const key = stringKey(theme);
		if (key === null || !applied.themes.has(key)) return true;
	}
	for (const lang of options.langs ?? []) {
		const key = stringKey(lang);
		if (key === null || !applied.langs.has(key)) return true;
	}
	if (options.defaultTheme !== undefined) {
		const key = stringKey(options.defaultTheme);
		if (key === null || !applied.themes.has(key)) return true;
	}
	if (options.cdn !== undefined && options.cdn !== applied.options.cdn) return true;
	if (options.workspace !== undefined && options.workspace !== applied.options.workspace) {
		return true;
	}
	if (options.lsp !== undefined && options.lsp !== applied.options.lsp) return true;
	return false;
}

/**
 * Loads and initializes modern-monaco exactly once per page.
 *
 * modern-monaco's `init()` is a global singleton: themes, langs, and LSP
 * config apply page-wide, and `monaco.editor.setTheme()` can only switch to
 * themes that were registered at init time. Options passed by every caller
 * before the module finishes loading are merged into the single `init()`
 * call; options that arrive after that and ask for anything new are ignored
 * with a warning.
 *
 * Call this early (e.g. in a root layout) to warm up the editor and to
 * register every theme your app switches between.
 */
export function preloadMonaco(options?: InitOptions): Promise<Monaco> {
	if (typeof window === 'undefined') {
		throw new Error(
			'[modern-monaco-svelte] preloadMonaco() is browser-only — call it from onMount() or an $effect.'
		);
	}
	if (options) {
		if (applied) {
			if (hasLateAdditions(options)) {
				console.warn(
					'[modern-monaco-svelte] Monaco is already initialized; additional init options are ignored. ' +
						'Register all themes/langs/lsp options before the first editor mounts, e.g. via preloadMonaco().'
				);
			}
		} else {
			pendingOptions.push(options);
		}
	}
	monacoPromise ??= (async () => {
		const { init } = await import('modern-monaco');
		const merged = mergeInitOptions(pendingOptions);
		pendingOptions = [];

		const themeKeys = (merged.themes ?? []).map(stringKey).filter((key) => key !== null);
		const defaultThemeKey = stringKey(merged.defaultTheme);
		if (defaultThemeKey !== null) themeKeys.push(defaultThemeKey);
		applied = {
			// vitesse-dark ships bundled as modern-monaco's default theme
			themes: new Set(['vitesse-dark', ...themeKeys]),
			langs: new Set((merged.langs ?? []).map(stringKey).filter((key) => key !== null)),
			options: merged
		};

		return init(merged);
	})();
	return monacoPromise;
}
