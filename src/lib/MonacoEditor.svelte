<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { preloadMonaco } from './monaco.js';
	import type { EditorOptions, InitOptions, Monaco, MonacoCodeEditor } from './types.js';

	interface Props {
		/** Editor content — supports `bind:value`. */
		value?: string;
		/** Language id (reactive). */
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
		 * Extra modern-monaco init options (langs, lsp, cdn, workspace).
		 * Init is page-global: options are merged across editors mounting before
		 * the first init resolves and ignored afterwards.
		 */
		init?: InitOptions;
		/** The underlying monaco editor instance — supports `bind:editor`, set once ready. */
		editor?: MonacoCodeEditor;
		/** Called once the editor is created — escape hatch to the raw monaco API. */
		onready?: (editor: MonacoCodeEditor, monaco: Monaco) => void;
		/** Called on every content change. */
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

	onMount(() => {
		let disposed = false;
		const disposables: { dispose(): void }[] = [];

		(async () => {
			const initOptions: InitOptions = { ...init };
			const allThemes = [...(theme ? [theme] : []), ...themes, ...(init?.themes ?? [])];
			if (allThemes.length > 0) initOptions.themes = allThemes;

			const m = await preloadMonaco(initOptions);
			if (disposed || !container) return;
			monaco = m;

			const created = m.editor.create(container, {
				value,
				language,
				...(theme ? { theme } : {}),
				automaticLayout: true,
				...options
			});
			editor = created;

			disposables.push(
				created.onDidChangeModelContent(() => {
					const next = created.getValue();
					if (next !== value) {
						value = next;
						onchange?.(next);
					}
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
		};
	});

	// Push external value changes into the editor.
	$effect(() => {
		const next = value;
		if (editor && editor.getValue() !== next) {
			editor.setValue(next);
		}
	});

	// Reactive theme switching.
	$effect(() => {
		if (monaco && theme) {
			monaco.editor.setTheme(theme);
		}
	});

	// Reactive language switching.
	$effect(() => {
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
