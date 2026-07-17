<script lang="ts">
	import { MarkdownEditor } from 'modern-monaco-svelte';
	import { ui } from '$lib/ui.svelte.js';
	import changelog from '../../../../CHANGELOG.md?raw';
</script>

<section>
	<h2>Changelog</h2>
	<MarkdownEditor
		value={changelog}
		options={{ readOnly: true }}
		dark={ui.dark}
		class="editor"
	>
		{#snippet loading()}
			<p class="loading">Loading…</p>
		{/snippet}
	</MarkdownEditor>
</section>

<style>
	section {
		margin-bottom: 2rem;
	}

	h2 {
		font-size: 1.1rem;
		margin: 0 0 0.75rem;
	}

	:global(.editor) {
		height: 36rem;
		border: 1px solid #8884;
		border-radius: 0.5rem;
	}

	.loading {
		display: grid;
		place-items: center;
		height: 100%;
		margin: 0;
		color: #888;
	}
</style>
