<script lang="ts">
	import MonacoDiffEditor from '../../../lib/MonacoDiffEditor.svelte';
	import type { Monaco, MonacoDiffEditorInstance } from '../../../lib/types.js';

	let {
		original: initialOriginal = '',
		modified: initialModified = '',
		language = 'plaintext',
		readOnly: initialReadOnly = true,
		onready = undefined
	}: {
		original?: string;
		modified?: string;
		language?: string;
		readOnly?: boolean;
		onready?: (editor: MonacoDiffEditorInstance, monaco: Monaco) => void;
	} = $props();

	// intentional one-time snapshots of the initial props
	// svelte-ignore state_referenced_locally
	let original = $state(initialOriginal);
	// svelte-ignore state_referenced_locally
	let modified = $state(initialModified);
	let editor = $state<MonacoDiffEditorInstance>();
	// svelte-ignore state_referenced_locally
	let readOnly = $state(initialReadOnly);

	export function getModified(): string {
		return modified;
	}
	export function setModified(next: string) {
		modified = next;
	}
	export function setOriginal(next: string) {
		original = next;
	}
	export function getEditor(): MonacoDiffEditorInstance | undefined {
		return editor;
	}
	export function setReadOnly(next: boolean) {
		readOnly = next;
	}
</script>

<MonacoDiffEditor
	bind:editor
	bind:modified
	{original}
	{language}
	{readOnly}
	{onready}
	class="host-diff"
/>

<style>
	:global(.host-diff) {
		height: 300px;
	}
</style>
