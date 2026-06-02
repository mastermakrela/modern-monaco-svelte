<script lang="ts">
	import type { Workspace } from 'modern-monaco';
	import { onMount, type Snippet } from 'svelte';
	import { preloadMonaco } from './monaco.js';
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
		 * Active theme (reactive). Switching only works between themes
		 * registered at init time — list them in `themes` or via `preloadMonaco()`.
		 */
		theme?: string;
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

	onMount(() => {
		const disposables: { dispose(): void }[] = [];

		(async () => {
			const initOptions: InitOptions = { ...init };
			const allThemes = [...(theme ? [theme] : []), ...themes, ...(init?.themes ?? [])];
			if (allThemes.length > 0) initOptions.themes = allThemes;
			if (workspace) initOptions.workspace = workspace;

			const m = await preloadMonaco(initOptions);
			if (disposed || !container) return;
			monaco = m;

			const created = m.editor.create(
				container,
				workspace
					? {
							// the open file provides the model
							model: null,
							...(theme ? { theme } : {}),
							automaticLayout: true,
							...options
						}
					: {
							value,
							language,
							...(theme ? { theme } : {}),
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

	// Open the requested workspace file (reactive on `file`).
	$effect(() => {
		const target = file;
		if (monaco && editor && workspace && target) {
			void openFile(workspace, editor, target);
		}
	});

	async function openFile(ws: Workspace, ed: MonacoCodeEditor, path: string) {
		const model = await ws.openTextDocument(path);
		// bail if the editor went away or the target changed while loading
		if (disposed || file !== path || ed.getModel() === model) return;

		const previous = ed.getModel();
		if (previous && previous.uri.scheme === 'file') {
			const state = ed.saveViewState();
			if (state) void ws.viewState.save(previous.uri.toString(), state);
		}

		ed.setModel(model);

		const state = await ws.viewState.get(model.uri.toString());
		if (!disposed && state && ed.getModel() === model) {
			ed.restoreViewState(state);
		}

		if (followHistory && workspacePath(ws.history.state.current ?? '') !== path) {
			ws.history.push(path);
		}
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

	// Reactive theme switching.
	$effect(() => {
		if (monaco && theme) {
			monaco.editor.setTheme(theme);
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
