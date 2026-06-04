<script module lang="ts">
	// Module-global so synthetic model URIs stay unique across every diff editor
	// on the page (a per-instance counter would collide — two editors would both
	// mint `diff://original/1`, and the second model creation would throw).
	let uriSeq = 0;
</script>

<script lang="ts">
	import type { Workspace } from 'modern-monaco';
	import { onMount, type Snippet, untrack } from 'svelte';
	import { attachWorkspace, preloadMonaco } from './monaco.js';
	import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, resolveTheme } from './theme.svelte.js';
	import type {
		DiffEditorOptions,
		InitOptions,
		Monaco,
		MonacoCodeEditor,
		MonacoDiffEditorInstance
	} from './types.js';

	interface Props {
		/**
		 * Original (left) content. Ignored for the left side when a `workspace`
		 * + `originalFile` are given — the file decides.
		 */
		original?: string;
		/**
		 * Modified (right) content — supports `bind:modified`. With a `workspace`
		 * + `modifiedFile` the file decides instead (and `bind:modified` mirrors it).
		 */
		modified?: string;
		/** Language id for both sides (value mode). Ignored where a file backs a side. */
		language?: string;
		/** Per-side language override for the original (value mode). Falls back to `language`. */
		originalLanguage?: string;
		/** Per-side language override for the modified (value mode). Falls back to `language`. */
		modifiedLanguage?: string;
		/**
		 * Whether the diff is read-only. `true` (the default) is a pure preview;
		 * `false` lets the user edit the modified (right) side (the original
		 * stays read-only) — pair it with `bind:modified`.
		 */
		readOnly?: boolean;
		/**
		 * Active theme (reactive). When omitted, follows the system's
		 * `prefers-color-scheme` using `themeLight`/`themeDark` (live). Switching
		 * only works between themes registered at init time.
		 */
		theme?: string;
		/** Theme used when the system prefers light (no explicit `theme`). */
		themeLight?: string;
		/** Theme used when the system prefers dark (no explicit `theme`). */
		themeDark?: string;
		/**
		 * Drives the light/dark choice between `themeLight`/`themeDark` from your
		 * own source instead of `prefers-color-scheme`. Ignored when `theme` is set.
		 */
		dark?: boolean;
		/** Additional themes to register at init so `theme` can switch to them later. */
		themes?: string[];
		/** Monaco `IStandaloneDiffEditorConstructionOptions` passed to `createDiffEditor`. */
		options?: DiffEditorOptions;
		/**
		 * Extra modern-monaco init options (langs, lsp, cdn). Init is page-global:
		 * merged across editors mounting before the first init resolves.
		 */
		init?: InitOptions;
		/**
		 * Workspace backing file-mode sides (virtual filesystem). Page-global like
		 * the rest of the init options — every editor on the page must share it.
		 */
		workspace?: Workspace;
		/** Original (left) file path in the `workspace`. Reactive: swaps the left model. */
		originalFile?: string;
		/** Modified (right) file path in the `workspace`. Reactive: swaps the right model. */
		modifiedFile?: string;
		/** The underlying monaco diff editor instance — supports `bind:editor`, set once ready. */
		editor?: MonacoDiffEditorInstance;
		/** Called once the diff editor is created — escape hatch to the raw monaco API. */
		onready?: (editor: MonacoDiffEditorInstance, monaco: Monaco) => void;
		/** Called on every edit of the modified side (not on file switches). */
		onchange?: (value: string) => void;
		/** Rendered until the editor is ready. */
		loading?: Snippet;
		/** Class for the outer container (size the editor through it). */
		class?: string;
	}

	let {
		original = '',
		modified = $bindable(''),
		language = 'plaintext',
		originalLanguage,
		modifiedLanguage,
		readOnly = true,
		theme,
		themeLight = DEFAULT_LIGHT_THEME,
		themeDark = DEFAULT_DARK_THEME,
		dark,
		themes = [],
		options = {},
		init,
		workspace,
		originalFile,
		modifiedFile,
		editor = $bindable(undefined),
		onready,
		onchange,
		loading,
		class: className = ''
	}: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let monaco: Monaco | undefined = $state();
	let ready = $state(false);
	let disposed = false;

	const resolvedTheme = $derived(resolveTheme(theme, themeLight, themeDark, dark));

	// value-mode models are created (and owned) by us; workspace-mode models
	// belong to the workspace and must not be disposed here. Each owned model
	// gets a unique URI so re-creation never collides with a not-yet-disposed one.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- teardown bookkeeping, never read reactively
	const ownedModels = new Set<{ dispose(): void }>();

	onMount(() => {
		const disposables: { dispose(): void }[] = [];

		(async () => {
			const initOptions: InitOptions = { ...init };
			const allThemes = [
				...(theme ? [theme] : [themeLight, themeDark]),
				...themes,
				...(init?.themes ?? [])
			];
			if (allThemes.length > 0) initOptions.themes = allThemes;
			if (workspace) initOptions.workspace = workspace;

			const m = await preloadMonaco(initOptions);
			if (disposed || !container) return;
			if (workspace) attachWorkspace(workspace, m);
			monaco = m;

			const created = m.editor.createDiffEditor(container, {
				theme: resolvedTheme,
				automaticLayout: true,
				readOnly,
				// the original (left) is the "before" — never editable
				originalEditable: false,
				...options
			});
			editor = created;

			// two-way binding + onchange for edits on the modified (right) side
			const modifiedEditor = created.getModifiedEditor();
			disposables.push(
				modifiedEditor.onDidChangeModelContent(() => {
					const next = modifiedEditor.getValue();
					if (next !== modified) {
						modified = next;
						onchange?.(next);
					}
				}),
				// model swaps (file switches) update the bound value without onchange
				modifiedEditor.onDidChangeModel(() => {
					const next = modifiedEditor.getValue();
					if (next !== modified) modified = next;
				})
			);

			ready = true;
			onready?.(created, m);
		})();

		return () => {
			disposed = true;
			disposables.forEach((d) => d.dispose());
			editor?.dispose();
			editor = undefined;
			ownedModels.forEach((model) => model.dispose());
			ownedModels.clear();
		};
	});

	// (Re)build the diff models when their identity changes — the backing mode
	// (value vs. workspace file), the file paths, or the value-mode languages.
	// Content updates are pushed separately so a value change never rebuilds.
	$effect(() => {
		const ws = workspace;
		const oFile = originalFile;
		const mFile = modifiedFile;
		const oLang = originalLanguage ?? language;
		const mLang = modifiedLanguage ?? language;
		if (!monaco || !editor) return;
		const m = monaco;
		const ed = editor;
		const oVal = untrack(() => original);
		const mVal = untrack(() => modified);

		let cancelled = false;
		const created: { dispose(): void }[] = [];

		const makeModel = async (
			file: string | undefined,
			value: string,
			lang: string,
			side: string
		) => {
			if (ws && file) return ws.openTextDocument(file);
			const model = m.editor.createModel(value, lang, `diff://${side}/${++uriSeq}`);
			created.push(model);
			ownedModels.add(model);
			return model;
		};

		(async () => {
			const [originalModel, modifiedModel] = await Promise.all([
				makeModel(oFile, oVal, oLang, 'original'),
				makeModel(mFile, mVal, mLang, 'modified')
			]);
			if (cancelled || disposed) return;
			ed.setModel({ original: originalModel, modified: modifiedModel });
		})();

		return () => {
			cancelled = true;
			created.forEach((model) => {
				ownedModels.delete(model);
				model.dispose();
			});
		};
	});

	// Push external original content into its model (value mode only).
	$effect(() => {
		const next = original;
		if (workspace && originalFile) return;
		const model = editor?.getModel()?.original;
		if (model && model.getValue() !== next) model.setValue(next);
	});

	// Push external modified content into its model (value mode only). When
	// editable, apply it as an undoable edit so the undo stack and cursor/scroll
	// survive a mid-edit rewrite (matching MonacoEditor); otherwise setValue.
	$effect(() => {
		const next = modified;
		if (workspace && modifiedFile) return;
		const ed = editor;
		const model = ed?.getModel()?.modified;
		if (!ed || !model || model.getValue() === next) return;
		if (readOnly) {
			model.setValue(next);
		} else {
			applyExternalValue(ed.getModifiedEditor(), next);
		}
	});

	function applyExternalValue(ed: MonacoCodeEditor, next: string) {
		const model = ed.getModel();
		if (!model) return;
		const viewState = ed.saveViewState();
		ed.pushUndoStop();
		ed.executeEdits('external', [{ range: model.getFullModelRange(), text: next }]);
		ed.pushUndoStop();
		if (viewState) ed.restoreViewState(viewState);
	}

	// Reactive theme switching (explicit prop or live prefers-color-scheme).
	$effect(() => {
		if (monaco && resolvedTheme) monaco.editor.setTheme(resolvedTheme);
	});

	// Reactive read-only toggle.
	$effect(() => {
		editor?.updateOptions({ readOnly });
	});

	// Reactive construction options applied live (e.g. toggling
	// `renderSideBySide` between split and inline/unified view).
	$effect(() => {
		editor?.updateOptions(options);
	});
</script>

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
