<script lang="ts">
	import MonacoEditor from '../../../lib/MonacoEditor.svelte';
	import type { Monaco, MonacoCodeEditor } from '../../../lib/types.js';

	let {
		initial = '',
		language: initialLanguage = 'plaintext',
		theme: initialTheme = undefined,
		themes = [],
		readOnly: initialReadOnly = false,
		onready = undefined
	}: {
		initial?: string;
		language?: string;
		theme?: string;
		themes?: string[];
		readOnly?: boolean;
		onready?: (editor: MonacoCodeEditor, monaco: Monaco) => void;
	} = $props();

	// intentional one-time snapshots of the initial props
	// svelte-ignore state_referenced_locally
	let value = $state(initial);
	let editor = $state<MonacoCodeEditor>();
	// svelte-ignore state_referenced_locally
	let theme = $state(initialTheme);
	// svelte-ignore state_referenced_locally
	let language = $state(initialLanguage);
	// svelte-ignore state_referenced_locally
	let readOnly = $state(initialReadOnly);

	export function getValue(): string {
		return value;
	}
	export function setReadOnly(next: boolean) {
		readOnly = next;
	}
	export function setValue(next: string) {
		value = next;
	}
	export function getEditor(): MonacoCodeEditor | undefined {
		return editor;
	}
	export function setTheme(next: string) {
		theme = next;
	}
	export function setLanguage(next: string) {
		language = next;
	}
</script>

<MonacoEditor
	bind:value
	bind:editor
	{language}
	{theme}
	{themes}
	{onready}
	options={{ readOnly }}
	class="host-editor"
/>

<style>
	:global(.host-editor) {
		height: 300px;
	}
</style>
