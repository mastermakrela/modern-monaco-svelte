<script lang="ts">
	import type { Workspace } from 'modern-monaco';
	import { onDestroy, type Snippet } from 'svelte';
	import MonacoEditor from './MonacoEditor.svelte';
	import { registerMarkdownActions } from './markdown/actions.js';
	import { acquireMarkdownCompletions } from './markdown/completions.js';
	import { createMarkdownDecorations } from './markdown/decorations.js';
	import { markdownEditorDefaults } from './markdown/defaults.js';
	import { setupMarkdownOnType } from './markdown/on-type.js';
	import type {
		EditorOptions,
		IDisposable,
		InitOptions,
		Monaco,
		MonacoCodeEditor
	} from './types.js';

	interface Props {
		/** Editor content — supports `bind:value`. */
		value?: string;
		/** Active theme (reactive). Register every theme you switch between via `themes`. */
		theme?: string;
		/** Additional themes to register at init. */
		themes?: string[];
		/** Monaco editor options — merged over the markdown-friendly defaults. */
		options?: EditorOptions;
		/** Extra modern-monaco init options (see `MonacoEditor`). */
		init?: InitOptions;
		/** Workspace backing the editor (see `MonacoEditor`). */
		workspace?: Workspace;
		/** The open file — supports `bind:file` (see `MonacoEditor`). */
		file?: string;
		/** Follow and drive `workspace.history` (see `MonacoEditor`). */
		followHistory?: boolean;
		/** The underlying monaco editor instance — supports `bind:editor`. */
		editor?: MonacoCodeEditor;
		onready?: (editor: MonacoCodeEditor, monaco: Monaco) => void;
		onchange?: (value: string) => void;
		/** Renders a hidden form input with this name, kept in sync with `value`. */
		name?: string;
		/** Rendered until the editor is ready. */
		loading?: Snippet;
		/** Class for the outer container (size the editor through it). */
		class?: string;
		/** Cmd/Ctrl+B/I/E/K/Shift+X formatting shortcuts. */
		shortcuts?: boolean;
		/** Snippet completions for headings, code blocks, links, images. */
		completions?: boolean;
		/** Auto-continue `- ` / `1. ` lists on Enter. */
		listContinuation?: boolean;
		/** Live `**bold**` / `*italic*` inline styling. */
		inlineDecorations?: boolean;
	}

	let {
		value = $bindable(''),
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
		class: className = '',
		shortcuts = true,
		completions = true,
		listContinuation = true,
		inlineDecorations = true
	}: Props = $props();

	const disposables: IDisposable[] = [];

	function handleReady(created: MonacoCodeEditor, monaco: Monaco) {
		if (shortcuts) disposables.push(registerMarkdownActions(created, monaco));
		if (completions) disposables.push(acquireMarkdownCompletions(monaco));
		if (listContinuation) disposables.push(setupMarkdownOnType(created, monaco));
		if (inlineDecorations) disposables.push(createMarkdownDecorations(created, monaco));
		onready?.(created, monaco);
	}

	onDestroy(() => {
		disposables.forEach((d) => d.dispose());
	});
</script>

<MonacoEditor
	bind:value
	bind:editor
	bind:file
	language="markdown"
	{theme}
	{themes}
	{init}
	{workspace}
	{followHistory}
	{name}
	{loading}
	{onchange}
	class={className}
	options={{ ...markdownEditorDefaults, ...options }}
	onready={handleReady}
/>

<style>
	:global(.monaco-editor .markdown-strong) {
		font-weight: 600;
	}

	:global(.monaco-editor .markdown-emphasis) {
		font-style: italic;
	}
</style>
