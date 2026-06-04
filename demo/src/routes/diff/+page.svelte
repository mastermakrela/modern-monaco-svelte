<script lang="ts">
	import { MonacoDiffEditor } from 'modern-monaco-svelte';
	import { ui } from '$lib/ui.svelte.js';

	// A small one-line fix: a typo in the returned string.
	const codeOriginal = [
		'function greet(name: string) {',
		'\treturn "Helo, " + name;',
		'}',
		''
	].join('\n');
	let codeModified = $state(
		['function greet(name: string) {', '\treturn "Hello, " + name;', '}', ''].join('\n')
	);

	// A couple of typo/word fixes in prose.
	const docsOriginal = [
		'# Recipe: Pancakes',
		'',
		'Mix the flor and eggs, then cook on a hot pan.',
		'Serve with maple syrup.',
		''
	].join('\n');
	let docsModified = $state(
		[
			'# Recipe: Pancakes',
			'',
			'Whisk the flour and eggs, then cook in a hot pan.',
			'Serve with maple syrup.',
			''
		].join('\n')
	);

	let readOnly = $state(true);
	let inline = $state(false);
</script>

<section>
	<h2>Diff editor</h2>
	<p>
		Compare two sources side-by-side (or unified). Read-only preview by default; toggle editing to
		change the modified (right) side — the original stays read-only.
	</p>

	<div class="controls">
		<label>
			<input type="checkbox" bind:checked={readOnly} />
			read-only
		</label>
		<label>
			<input type="checkbox" bind:checked={inline} />
			inline (unified) view
		</label>
	</div>
</section>

<section>
	<h3>Code — fixing a typo</h3>
	<MonacoDiffEditor
		original={codeOriginal}
		bind:modified={codeModified}
		language="typescript"
		{readOnly}
		dark={ui.dark}
		options={{ renderSideBySide: !inline }}
		class="editor"
	>
		{#snippet loading()}
			<p class="loading">Loading editor…</p>
		{/snippet}
	</MonacoDiffEditor>
</section>

<section>
	<h3>Markdown — small wording edits</h3>
	<MonacoDiffEditor
		original={docsOriginal}
		bind:modified={docsModified}
		language="markdown"
		{readOnly}
		dark={ui.dark}
		options={{ renderSideBySide: !inline }}
		class="editor"
	>
		{#snippet loading()}
			<p class="loading">Loading editor…</p>
		{/snippet}
	</MonacoDiffEditor>
</section>

<style>
	section {
		margin-bottom: 1.5rem;
	}

	h2 {
		font-size: 1.1rem;
		margin: 0 0 0.25rem;
	}

	h3 {
		font-size: 0.95rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		opacity: 0.85;
	}

	p {
		margin: 0 0 0.75rem;
		opacity: 0.8;
	}

	.controls {
		display: flex;
		gap: 1.25rem;
	}

	label {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
		cursor: pointer;
	}

	:global(.editor) {
		height: 14rem;
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
