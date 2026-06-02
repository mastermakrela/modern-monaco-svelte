<script lang="ts">
	import { resolve } from '$app/paths';
	import { LazyMonacoEditor } from '$lib/index.js';

	let { data } = $props();
</script>

<main>
	<header>
		<h1>LazyMonacoEditor</h1>
		<a href={resolve('/')}>← init mode demo</a>
	</header>

	<h2>SSR + hydration (zero flash)</h2>
	<LazyMonacoEditor html={data.editorHtml} class="demo-editor" />

	<h2>Client-side lazy mode (embedded code)</h2>
	<!-- no theme prop: picks light/dark from the system at mount -->
	<LazyMonacoEditor
		value={`console.log("loaded lazily, no SSR");` + '\n'}
		language="javascript"
		class="demo-editor"
	/>
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
	}

	h1 {
		font-size: 1.25rem;
		margin: 0;
	}

	h2 {
		font-size: 1rem;
		margin: 1.5rem 0 0.5rem;
	}

	:global(.demo-editor) {
		height: 16rem;
		border: 1px solid #8884;
		border-radius: 0.5rem;
	}
</style>
