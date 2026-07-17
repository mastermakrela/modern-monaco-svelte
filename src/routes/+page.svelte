<script lang="ts">
	import { resolve } from '$app/paths';
	import { MarkdownEditor } from '$lib/index.js';

	let value = $state(
		[
			'# modern-monaco-svelte',
			'',
			'A **drop-in** markdown editor with *syntax highlighting*.',
			'',
			'- press Enter at the end of this line to continue the list',
			'- Cmd/Ctrl+B toggles **bold**, Cmd/Ctrl+I toggles *italic*',
			'- Cmd/Ctrl+K wraps the selection as a [link](https://github.com/esm-dev/modern-monaco)',
			'',
			'Type `#` at the start of a line for heading completions.',
			''
		].join('\n')
	);
	let dark = $state(true);
</script>

<main>
	<header>
		<h1>modern-monaco-svelte</h1>
		<nav>
			<a href={resolve('/workspace')}>workspace demo →</a>
			<a href={resolve('/workspace-rows')}>workspace from DB rows →</a>
			<a href={resolve('/lazy')}>lazy / SSR demo →</a>
			<!-- full reload: modern-monaco/core shares its engine with this page's
			     default modern-monaco — an SPA transition between them would corrupt it -->
			<a href={resolve('/core')} data-sveltekit-reload>modern-monaco/core demo →</a>
			<a href={resolve('/changelog')}>changelog →</a>
			<button onclick={() => (dark = !dark)}>
				Switch to {dark ? 'light' : 'dark'} theme
			</button>
		</nav>
	</header>

	<MarkdownEditor
		bind:value
		theme={dark ? 'vitesse-dark' : 'vitesse-light'}
		themes={['vitesse-dark', 'vitesse-light']}
		class="demo-editor"
	>
		{#snippet loading()}
			<p class="loading">Loading editor…</p>
		{/snippet}
	</MarkdownEditor>

	<details>
		<summary>Bound value</summary>
		<pre>{value}</pre>
	</details>
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
		height: 24rem;
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

	details {
		margin-top: 1rem;
	}

	pre {
		background: #8881;
		padding: 1rem;
		border-radius: 0.5rem;
		white-space: pre-wrap;
	}
</style>
