<script lang="ts">
	import { onMount } from 'svelte';
	import type { Workspace } from 'modern-monaco';
	import { lazyOptionsScript } from './lazy-options.js';
	import { ensureLazyEditor } from './monaco.js';
	import type { EditorOptions, InitOptions } from './types.js';

	interface Props {
		/**
		 * Server-rendered editor HTML from `modern-monaco-svelte/ssr`
		 * (`renderEditor` / `renderMarkdownEditor`). Takes precedence over the
		 * other content props and gives a zero-flash pre-highlighted editor.
		 */
		html?: string;
		/**
		 * Initial code (one-way: lazy mode exposes no editor instance, so
		 * there is no value binding — use `MonacoEditor` for that).
		 */
		value?: string;
		/**
		 * File to open. With `workspace` the file is opened from (or created
		 * in) the workspace; without it the name just determines the language.
		 */
		filename?: string;
		/** Language id (ignored when `filename` implies one). */
		language?: string;
		/** Theme for this editor (must be loadable at init time). */
		theme?: string;
		/** Monaco editor options applied by the `<monaco-editor>` element. */
		options?: EditorOptions;
		/**
		 * Extra modern-monaco init options. `lazy()` is page-global and
		 * captures its options once — the first mounting editor (or an early
		 * `ensureLazyEditor()` call) must carry them all.
		 */
		init?: InitOptions;
		/**
		 * Workspace backing the editor. Edits are persisted to the workspace
		 * filesystem (IndexedDB by default).
		 */
		workspace?: Workspace;
		/**
		 * Called with the file's new content when it changes. Only available
		 * with `workspace` (observed via `workspace.fs.watch`).
		 */
		onchange?: (value: string) => void;
		/** Class for the outer container (size the editor through it). */
		class?: string;
	}

	let {
		html,
		value = '',
		filename,
		language,
		theme,
		options = {},
		init,
		workspace,
		onchange,
		class: className = ''
	}: Props = $props();

	const scriptHtml = $derived(
		lazyOptionsScript(filename ? { filename, code: value } : value, {
			...(language ? { language } : {}),
			...(theme ? { theme } : {}),
			...options
		})
	);

	onMount(() => {
		void ensureLazyEditor({ ...(workspace ? { workspace } : {}), ...init });

		if (workspace && onchange) {
			const target = filename ?? workspace.entryFile;
			if (target) {
				return workspace.fs.watch(target, (kind: 'create' | 'modify' | 'remove') => {
					if (kind === 'modify') {
						void workspace.fs.readTextFile(target).then(onchange);
					}
				});
			}
		}
	});
</script>

<div class={`mms-lazy ${className}`.trim()}>
	{#if html}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted server-rendered editor markup -->
		{@html html}
	{:else}
		<monaco-editor>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON is escaped by lazyOptionsScript -->
			{@html scriptHtml}
		</monaco-editor>
	{/if}
</div>

<style>
	.mms-lazy {
		display: block;
		position: relative;
		overflow: hidden;
	}
</style>
