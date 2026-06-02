<script lang="ts">
	import type { Workspace } from 'modern-monaco';
	import { onMount, type Snippet } from 'svelte';
	import { attachWorkspace, preloadMonaco } from './monaco.js';
	import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, resolveTheme } from './theme.svelte.js';
	import { workspacePath } from './workspace.svelte.js';
	import type { EditorOptions, InitOptions, Monaco, MonacoCodeEditor } from './types.js';

	interface Props {
		/**
		 * Editor content — supports `bind:value`. With a `workspace` the value
		 * follows the currently open file (and edits flow back to it).
		 */
		value?: string;
		/** Language id (reactive). Ignored with `workspace` — the file decides. */
		language?: string;
		/**
		 * Active theme (reactive). When omitted, the editor follows the
		 * system's `prefers-color-scheme` using `themeLight`/`themeDark`
		 * (live — it switches when the system setting changes). Switching
		 * only works between themes registered at init time — list them in
		 * `themes` or via `preloadMonaco()`.
		 */
		theme?: string;
		/** Theme used when the system prefers light (no explicit `theme`). */
		themeLight?: string;
		/** Theme used when the system prefers dark (no explicit `theme`). */
		themeDark?: string;
		/** Additional themes to register at init so `theme` can switch to them later. */
		themes?: string[];
		/** Monaco `IStandaloneEditorConstructionOptions` passed to `editor.create`. */
		options?: EditorOptions;
		/**
		 * Extra modern-monaco init options (langs, lsp, cdn).
		 * Init is page-global: options are merged across editors mounting before
		 * the first init resolves and ignored afterwards.
		 */
		init?: InitOptions;
		/**
		 * Workspace backing the editor (virtual filesystem, IndexedDB by
		 * default). Page-global like the rest of the init options — every
		 * editor on the page must share the same workspace.
		 */
		workspace?: Workspace;
		/**
		 * The open file — supports `bind:file` and is reactive: assigning a
		 * new path swaps the model (cursor/scroll state is saved and restored
		 * per file). Defaults to the workspace's entry file.
		 */
		file?: string;
		/**
		 * Follow and drive `workspace.history`: opening a file pushes a
		 * history entry, and `history.back()`/`forward()`/`push()` switch the
		 * editor (and update `file`).
		 */
		followHistory?: boolean;
		/** The underlying monaco editor instance — supports `bind:editor`, set once ready. */
		editor?: MonacoCodeEditor;
		/** Called once the editor is created — escape hatch to the raw monaco API. */
		onready?: (editor: MonacoCodeEditor, monaco: Monaco) => void;
		/** Called on every content edit (not on file switches). */
		onchange?: (value: string) => void;
		/** Renders a hidden form input with this name, kept in sync with `value`. */
		name?: string;
		/** Rendered until the editor is ready. */
		loading?: Snippet;
		/** Class for the outer container (size the editor through it). */
		class?: string;
	}

	let {
		value = $bindable(''),
		language = 'plaintext',
		theme,
		themeLight = DEFAULT_LIGHT_THEME,
		themeDark = DEFAULT_DARK_THEME,
		themes = [],
		options = {},
		init,
		workspace,
		file = $bindable(undefined),
		followHistory = false,
		editor = $bindable(undefined),
		onready,
		onchange,
		name,
		loading,
		class: className = ''
	}: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let monaco: Monaco | undefined = $state();
	let ready = $state(false);
	let disposed = false;

	const resolvedTheme = $derived(resolveTheme(theme, themeLight, themeDark));

	onMount(() => {
		const disposables: { dispose(): void }[] = [];

		(async () => {
			const initOptions: InitOptions = { ...init };
			// without an explicit theme, register the light/dark pair so the
			// editor can follow prefers-color-scheme changes
			const allThemes = [
				...(theme ? [theme] : [themeLight, themeDark]),
				...themes,
				...(init?.themes ?? [])
			];
			if (allThemes.length > 0) initOptions.themes = allThemes;
			if (workspace) initOptions.workspace = workspace;

			const m = await preloadMonaco(initOptions);
			if (disposed || !container) return;
			// wires the workspace even when init already ran without it
			// (e.g. this editor mounted after SPA navigation)
			if (workspace) attachWorkspace(workspace, m);
			monaco = m;

			const created = m.editor.create(
				container,
				workspace
					? {
							// the open file provides the model
							model: null,
							theme: resolvedTheme,
							automaticLayout: true,
							...options
						}
					: {
							value,
							language,
							theme: resolvedTheme,
							automaticLayout: true,
							...options
						}
			);
			editor = created;

			disposables.push(
				created.onDidChangeModelContent(() => {
					const next = created.getValue();
					if (next !== value) {
						value = next;
						onchange?.(next);
					}
				}),
				// model swaps (file switches) update the bound value without onchange
				created.onDidChangeModel(() => {
					const next = created.getValue();
					if (next !== value) {
						value = next;
					}
				})
			);

			if (workspace && !file) {
				const initial = workspace.history.state.current || workspace.entryFile;
				if (initial) file = workspacePath(initial);
			}

			ready = true;
			onready?.(created, m);
		})();

		return () => {
			disposed = true;
			disposables.forEach((d) => d.dispose());
			editor?.dispose();
			editor = undefined;
		};
	});

	// Open the requested workspace file (reactive on `file`). Opens are
	// serialized so rapid switches settle on the last requested file.
	let openQueue: Promise<void> = Promise.resolve();
	$effect(() => {
		const target = file;
		if (monaco && editor && workspace && target) {
			const ws = workspace;
			const ed = editor;
			openQueue = openQueue.then(() =>
				openFile(ws, ed, target).catch((error) => {
					// opens interrupted by unmount are expected noise
					if (!disposed) {
						console.error(`[modern-monaco-svelte] failed to open "${target}":`, error);
					}
				})
			);
		}
	});

	async function openFile(ws: Workspace, ed: MonacoCodeEditor, path: string) {
		// stale request (file changed again while queued) or already open
		if (disposed || file !== path) return;
		const previous = ed.getModel();
		if (previous && workspacePath(previous.uri.toString()) === path) return;

		// save the outgoing file's cursor/scroll state
		if (previous && previous.uri.scheme === 'file') {
			const state = ed.saveViewState();
			if (state) void ws.viewState.save(previous.uri.toString(), state);
		}

		// sets the model on this editor and restores its view state;
		// retry briefly on not-found — a freshly constructed workspace seeds
		// `initialFiles` into IndexedDB asynchronously
		for (let attempt = 0; ; attempt++) {
			try {
				await ws.openTextDocument(path, undefined, ed);
				break;
			} catch (error) {
				if (attempt >= 4 || !isNotFound(error)) throw error;
				await new Promise((resolve) => setTimeout(resolve, 150));
				if (disposed || file !== path) return;
			}
		}

		if (followHistory && !disposed && workspacePath(ws.history.state.current ?? '') !== path) {
			ws.history.push(path);
		}
	}

	function isNotFound(error: unknown): boolean {
		return (
			error instanceof Error &&
			(error.constructor.name === 'NotFoundError' || error.message.includes('No such file'))
		);
	}

	// Follow workspace history navigation (back/forward/push).
	$effect(() => {
		if (!workspace || !followHistory || !ready) return;
		return workspace.history.onChange((state: { readonly current: string }) => {
			const path = state.current ? workspacePath(state.current) : undefined;
			if (path && path !== file) {
				file = path;
			}
		});
	});

	// Push external value changes into the editor.
	$effect(() => {
		const next = value;
		if (editor && editor.getModel() && editor.getValue() !== next) {
			editor.setValue(next);
		}
	});

	// Reactive theme switching (explicit prop or live prefers-color-scheme).
	$effect(() => {
		if (monaco && resolvedTheme) {
			monaco.editor.setTheme(resolvedTheme);
		}
	});

	// Reactive language switching (file-driven languages win in workspace mode).
	$effect(() => {
		if (workspace) return;
		const model = editor?.getModel();
		if (monaco && model && language) {
			monaco.editor.setModelLanguage(model, language);
		}
	});
</script>

{#if name}
	<input type="hidden" {name} {value} />
{/if}
<div class={`mms-container ${className}`.trim()}>
	<div class="mms-editor" bind:this={container}></div>
	{#if !ready && loading}
		<div class="mms-loading">{@render loading()}</div>
	{/if}
</div>

<style>
	.mms-container {
		position: relative;
		overflow: hidden;
	}

	.mms-editor,
	.mms-loading {
		position: absolute;
		inset: 0;
	}
</style>
