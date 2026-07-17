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
 * A loadable modern-monaco entry point: the full `modern-monaco` package or
 * the slim `modern-monaco/core`. Both load the exact same underlying engine
 * and theme/syntax registries (`modern-monaco` just additionally registers
 * its bundled grammars/theme as a side effect of importing it) — see
 * {@link createInitSingleton}.
 */
interface MonacoModuleVariant {
	readonly label: 'modern-monaco' | 'modern-monaco/core';
	load(): Promise<typeof import('modern-monaco')>;
	/** Themes available without registration once this variant is loaded. */
	readonly bundledThemes: readonly string[];
	readonly baseOptions?: InitOptions;
}

const DEFAULT_VARIANT: MonacoModuleVariant = {
	label: 'modern-monaco',
	load: () => import('modern-monaco'),
	bundledThemes: [DEFAULT_DARK_THEME],
	// the default light/dark pair is always registered so editors that follow
	// prefers-color-scheme work regardless of mount order (vitesse-dark ships
	// bundled; vitesse-light is one small JSON fetch)
	baseOptions: { themes: [DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME] }
};

const CORE_VARIANT: MonacoModuleVariant = {
	label: 'modern-monaco/core',
	// modern-monaco/core's `export * from "./index"` re-export isn't resolved by
	// TypeScript under NodeNext (the relative specifier is missing a file
	// extension), so its computed type is missing init/lazy/etc. even though
	// they're really there at runtime — cast around the upstream typing gap.
	load: () => import('modern-monaco/core') as unknown as Promise<typeof import('modern-monaco')>,
	bundledThemes: []
};

/**
 * Builds a page-global once-only initializer: options from every caller that
 * registers before the modern-monaco module finishes loading are merged into
 * a single call; options that arrive after that and ask for anything new are
 * ignored with a warning.
 *
 * `modern-monaco` and `modern-monaco/core` share one engine and one set of
 * theme/syntax registries once either is imported — they are not isolated
 * variants, they're the same singleton reached two ways. So this singleton is
 * shared across both: whichever variant calls it first is the only one that
 * actually loads its module and runs `init()`/`lazy()`; a later call asking
 * for the other variant reuses that result and warns instead of loading a
 * second time, which would otherwise re-run `init()`/`lazy()` on an
 * already-running editor and corrupt its state.
 */
function createInitSingleton<T>(
	run: (mod: typeof import('modern-monaco'), merged: InitOptions) => T | Promise<T>,
	{
		handlesLateWorkspace = false,
		applyVariantBaseOptions = false
	}: { handlesLateWorkspace?: boolean; applyVariantBaseOptions?: boolean } = {}
): (variant: MonacoModuleVariant, options?: InitOptions) => Promise<T> {
	let promise: Promise<T> | null = null;
	let committedVariant: MonacoModuleVariant | null = null;
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

	return (variant: MonacoModuleVariant, options?: InitOptions): Promise<T> => {
		if (typeof window === 'undefined') {
			throw new Error(
				'[modern-monaco-svelte] monaco initialization is browser-only — call it from onMount() or an $effect.'
			);
		}
		if (committedVariant && committedVariant !== variant) {
			throw new Error(
				`[modern-monaco-svelte] Monaco is already initialized via '${committedVariant.label}'; ` +
					`cannot also use '${variant.label}' on the same page/SPA session — both entry points share ` +
					'the same underlying engine and theme/syntax registries, so mixing them would silently corrupt ' +
					"the running editor's themes/languages rather than fail loudly. Use one entry point per page, " +
					'or force a full page reload (e.g. `data-sveltekit-reload`) when navigating between pages that ' +
					'use different entry points.'
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
		if (!promise) {
			committedVariant = variant;
			promise = (async () => {
				const mod = await variant.load();
				const baseOptions = applyVariantBaseOptions ? variant.baseOptions : undefined;
				const merged = mergeInitOptions(baseOptions ? [...pending, baseOptions] : pending);
				pending = [];

				const themeKeys = (merged.themes ?? []).map(stringKey).filter((key) => key !== null);
				const defaultThemeKey = stringKey(merged.defaultTheme);
				if (defaultThemeKey !== null) themeKeys.push(defaultThemeKey);
				applied = {
					themes: new Set([...variant.bundledThemes, ...themeKeys]),
					langs: new Set((merged.langs ?? []).map(stringKey).filter((key) => key !== null)),
					options: merged
				};
				// init() wires its workspace itself — don't re-attach it later
				if (merged.workspace) attachedWorkspaces.add(merged.workspace);

				return run(mod, merged);
			})();
		}
		return promise;
	};
}

const runInit = createInitSingleton<Monaco>((mod, merged) => mod.init(merged), {
	// a workspace arriving after init is attached via attachWorkspace()
	handlesLateWorkspace: true,
	// only init mode injects the base theme pair (and only for whichever
	// variant wins) — lazy mode loads themes per element, none injected there
	applyVariantBaseOptions: true
});

const runLazy = createInitSingleton<void>((mod, merged) => {
	mod.lazy(merged);
});

/**
 * Loads and initializes modern-monaco's `init()` mode exactly once per page.
 *
 * modern-monaco's `init()` is a global singleton: themes, langs, and LSP
 * config apply page-wide, and `monaco.editor.setTheme()` can only switch to
 * themes that were registered at init time.
 *
 * Call this early (e.g. in a root layout) to warm up the editor and to
 * register every theme your app switches between.
 *
 * Shares its engine and theme/syntax registries with {@link preloadMonacoCore}
 * — see that function's docs. Don't call both on the same page/SPA session.
 */
export const preloadMonaco = (options?: InitOptions): Promise<Monaco> =>
	runInit(DEFAULT_VARIANT, options);

/**
 * Registers modern-monaco's `<monaco-editor>` custom element (`lazy()` mode)
 * exactly once per page. Used by `<LazyMonacoEditor>`.
 *
 * `lazy()` captures its options (including `workspace`) when the element is
 * defined — register the workspace and all themes/langs with the first call.
 * Note that `init()` mode and `lazy()` mode each load their own copy of the
 * editor; avoid mixing both modes on one page.
 *
 * Shares its engine and theme/syntax registries with
 * {@link ensureLazyEditorCore} — see that function's docs. Don't call both on
 * the same page/SPA session.
 */
export const ensureLazyEditor = (options?: InitOptions): Promise<void> =>
	runLazy(DEFAULT_VARIANT, options);

/**
 * Like {@link preloadMonaco}, but loads `modern-monaco/core` — the ~16KB
 * slim entry point with no bundled grammars, themes, or LSP. Use it when
 * bundle size matters and you register your own syntax/theme/LSP support.
 *
 * `registerSyntax()`, `registerTheme()`, and `registerLSPProvider()` (all
 * re-exported from this package) must be called before this function, since
 * `init()` resolves the languages and themes it's given as soon as it runs.
 *
 * `modern-monaco` and `modern-monaco/core` share the exact same underlying
 * engine and theme/syntax registries — they are not isolated from each
 * other. Don't call this together with {@link preloadMonaco} (or
 * {@link ensureLazyEditor}/{@link ensureLazyEditorCore}) on the same
 * page/SPA session: whichever loads first wins, and the other call is
 * ignored with a console warning rather than corrupting the running editor.
 */
export const preloadMonacoCore = (options?: InitOptions): Promise<Monaco> =>
	runInit(CORE_VARIANT, options);

/**
 * Like {@link ensureLazyEditor}, but loads `modern-monaco/core` — the
 * ~16KB slim entry point with no bundled grammars, themes, or LSP.
 *
 * `registerSyntax()`, `registerTheme()`, and `registerLSPProvider()` (all
 * re-exported from this package) must be called before this function, since
 * `lazy()` captures its options as soon as the custom element is defined.
 *
 * Shares its engine and theme/syntax registries with `modern-monaco`'s
 * default entry point — see {@link preloadMonacoCore}'s docs on why this
 * can't be mixed with {@link preloadMonaco}/{@link ensureLazyEditor} on the
 * same page/SPA session.
 */
export const ensureLazyEditorCore = (options?: InitOptions): Promise<void> =>
	runLazy(CORE_VARIANT, options);
