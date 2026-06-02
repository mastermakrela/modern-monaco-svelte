<script lang="ts">
	import MarkdownEditor from '../../../lib/MarkdownEditor.svelte';
	import type { EditorOptions, MonacoCodeEditor } from '../../../lib/types.js';

	let {
		initial = '',
		options = {},
		inlineDecorations = true
	}: {
		initial?: string;
		options?: EditorOptions;
		inlineDecorations?: boolean;
	} = $props();

	// intentional one-time snapshot of the initial prop
	// svelte-ignore state_referenced_locally
	let value = $state(initial);
	let editor = $state<MonacoCodeEditor>();

	export function getValue(): string {
		return value;
	}
	export function setValue(next: string) {
		value = next;
	}
	export function getEditor(): MonacoCodeEditor | undefined {
		return editor;
	}
</script>

<MarkdownEditor bind:value bind:editor {options} {inlineDecorations} class="host-editor" />

<style>
	:global(.host-editor) {
		height: 300px;
	}
</style>
