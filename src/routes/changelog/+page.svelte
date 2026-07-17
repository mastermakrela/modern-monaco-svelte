<script lang="ts">
	import { resolve } from '$app/paths';
	import { MarkdownEditor } from '$lib/index.js';
	import changelog from '../../../CHANGELOG.md?raw';
</script>

<main>
	<header>
		<h1>Changelog</h1>
		<a href={resolve('/')}>← init mode demo</a>
	</header>

	<MarkdownEditor value={changelog} options={{ readOnly: true }} class="demo-editor">
		{#snippet loading()}
			<p class="loading">Loading…</p>
		{/snippet}
	</MarkdownEditor>
</main>

<style>
	main {
		max-width: 56rem;
		margin: 0 auto;
		padding: 2rem 1rem;
		font-family: system-ui, sans-serif;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	h1 {
		font-size: 1.25rem;
		margin: 0;
	}

	:global(.demo-editor) {
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
