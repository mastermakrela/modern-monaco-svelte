import type { Workspace } from 'modern-monaco';
import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME } from './theme.svelte.js';
import type { InitOptions, Monaco } from './types.js';

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

interface AppliedState {
	themes: Set<string>;
	langs: Set<string>;
	options: InitOptions;
}

/** Workspaces already wired to a monaco instance (via init or attachWorkspace). */
const attachedWorkspaces = new WeakSet<object>();

/**
 * Wires a workspace to an already-initialized monaco instance, so editors
 * mounting after init (e.g. on SPA navigation) can still use it. No-op for
 * workspaces that went through `init()` or were attached before.
 *
 * Compared to passing the workspace to the first `init()`, late attachment
 * skips the LSP integration (filesystem-aware import completions) — prefer
 * `preloadMonaco({ workspace })` early when you need that.
 */
export function attachWorkspace(workspace: Workspace, monaco: Monaco): void {
	if (attachedWorkspaces.has(workspace)) return;
	attachedWorkspaces.add(workspace);
	const candidate = workspace as unknown as { setupMonaco?: (monaco: Monaco) => void };
	if (typeof candidate.setupMonaco === 'function') {
		candidate.setupMonaco(monaco);
	} else {
		console.error(
			'[modern-monaco-svelte] Unable to attach the workspace after init: workspace.setupMonaco() is missing ' +
				'(modern-monaco internals changed). Register the workspace before the first editor mounts via preloadMonaco({ workspace }).'
		);
	}
}

/**
 * Builds a page-global once-only initializer: options from every caller that
 * registers before the modern-monaco module finishes loading are merged into
 * a single call; options that arrive after that and ask for anything new are
 * ignored with a warning.
 */
function createInitSingleton<T>(
	run: (mod: typeof import('modern-monaco'), merged: InitOptions) => T | Promise<T>,
	{
		handlesLateWorkspace = false,
		baseOptions
	}: { handlesLateWorkspace?: boolean; baseOptions?: InitOptions } = {}
): (options?: InitOptions) => Promise<T> {
	let promise: Promise<T> | null = null;
	let pending: InitOptions[] = [];
	let applied: AppliedState | null = null;

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
		if (
			!handlesLateWorkspace &&
			options.workspace !== undefined &&
			options.workspace !== applied.options.workspace
		) {
			return true;
		}
		if (options.lsp !== undefined && options.lsp !== applied.options.lsp) return true;
		return false;
	}

	return (options?: InitOptions): Promise<T> => {
		if (typeof window === 'undefined') {
			throw new Error(
				'[modern-monaco-svelte] monaco initialization is browser-only — call it from onMount() or an $effect.'
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
				pending.push(options);
			}
		}
		promise ??= (async () => {
			const mod = await import('modern-monaco');
			const merged = mergeInitOptions(baseOptions ? [...pending, baseOptions] : pending);
			pending = [];

			const themeKeys = (merged.themes ?? []).map(stringKey).filter((key) => key !== null);
			const defaultThemeKey = stringKey(merged.defaultTheme);
			if (defaultThemeKey !== null) themeKeys.push(defaultThemeKey);
			applied = {
				// vitesse-dark ships bundled as modern-monaco's default theme
				themes: new Set(['vitesse-dark', ...themeKeys]),
				langs: new Set((merged.langs ?? []).map(stringKey).filter((key) => key !== null)),
				options: merged
			};
			// init() wires its workspace itself — don't re-attach it later
			if (merged.workspace) attachedWorkspaces.add(merged.workspace);

			return run(mod, merged);
		})();
		return promise;
	};
}

/**
 * Loads and initializes modern-monaco's `init()` mode exactly once per page.
 *
 * modern-monaco's `init()` is a global singleton: themes, langs, and LSP
 * config apply page-wide, and `monaco.editor.setTheme()` can only switch to
 * themes that were registered at init time.
 *
 * Call this early (e.g. in a root layout) to warm up the editor and to
 * register every theme your app switches between.
 */
export const preloadMonaco: (options?: InitOptions) => Promise<Monaco> = createInitSingleton(
	(mod, merged) => mod.init(merged),
	{
		// a workspace arriving after init is attached via attachWorkspace()
		handlesLateWorkspace: true,
		// the default light/dark pair is always registered so editors that
		// follow prefers-color-scheme work regardless of mount order
		// (vitesse-dark ships bundled; vitesse-light is one small JSON fetch)
		baseOptions: { themes: [DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME] }
	}
);

/**
 * Registers modern-monaco's `<monaco-editor>` custom element (`lazy()` mode)
 * exactly once per page. Used by `<LazyMonacoEditor>`.
 *
 * `lazy()` captures its options (including `workspace`) when the element is
 * defined — register the workspace and all themes/langs with the first call.
 * Note that `init()` mode and `lazy()` mode each load their own copy of the
 * editor; avoid mixing both modes on one page.
 */
export const ensureLazyEditor: (options?: InitOptions) => Promise<void> = createInitSingleton(
	(mod, merged) => {
		mod.lazy(merged);
	}
);
