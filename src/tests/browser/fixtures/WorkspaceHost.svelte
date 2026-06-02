<script lang="ts">
	import type { Workspace } from 'modern-monaco';
	import MonacoEditor from '../../../lib/MonacoEditor.svelte';
	import type { MonacoCodeEditor } from '../../../lib/types.js';

	let {
		workspace,
		initialFile = undefined,
		followHistory = false
	}: {
		workspace: Workspace;
		initialFile?: string;
		followHistory?: boolean;
	} = $props();

	// intentional one-time snapshot of the initial prop
	// svelte-ignore state_referenced_locally
	let file = $state(initialFile);
	let value = $state('');
	let editor = $state<MonacoCodeEditor>();

	export function getEditor(): MonacoCodeEditor | undefined {
		return editor;
	}
	export function getFile(): string | undefined {
		return file;
	}
	export function setFile(next: string) {
		file = next;
	}
	export function getValue(): string {
		return value;
	}
</script>

<MonacoEditor bind:value bind:editor bind:file {workspace} {followHistory} class="host-editor" />

<style>
	:global(.host-editor) {
		height: 300px;
	}
</style>
