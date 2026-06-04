<script lang="ts">
	import { MarkdownEditor, MonacoEditor } from 'modern-monaco-svelte';
	import { ui } from '$lib/ui.svelte.js';

	let markdown = $state(
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

	let code = $state(
		[
			'import { MonacoEditor } from "modern-monaco-svelte";',
			'',
			'// edits flow out through bind:value, external changes flow back in',
			'export function greet(name: string) {',
			'\treturn `hello, ${name}`;',
			'}',
			''
		].join('\n')
	);

	// Locking editing turns the editor into a syntax-highlighted code block.
	let locked = $state(true);
</script>

<section>
	<h2>Markdown editor</h2>
	<p>Formatting shortcuts, snippet completions, list continuation, live bold/italic styling.</p>
	<MarkdownEditor bind:value={markdown} dark={ui.dark} class="editor">
		{#snippet loading()}
			<p class="loading">Loading editor…</p>
		{/snippet}
	</MarkdownEditor>
</section>

<section>
	<h2>Generic code editor</h2>
	<p>
		A thin wrapper over Monaco with two-way <code>bind:value</code> and reactive theming. Pass
		<code>options={'{{ readOnly: true }}'}</code> to lock editing and use it as a syntax-highlighted
		code block.
	</p>
	<label class="lock">
		<input type="checkbox" bind:checked={locked} />
		lock editing (read-only code block)
	</label>
	<MonacoEditor
		bind:value={code}
		language="typescript"
		dark={ui.dark}
		options={{ readOnly: locked }}
		class="editor"
	>
		{#snippet loading()}
			<p class="loading">Loading editor…</p>
		{/snippet}
	</MonacoEditor>
</section>

<style>
	section {
		margin-bottom: 2rem;
	}

	h2 {
		font-size: 1.1rem;
		margin: 0 0 0.25rem;
	}

	p {
		margin: 0 0 0.75rem;
		opacity: 0.8;
	}

	.lock {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
		margin-bottom: 0.75rem;
		cursor: pointer;
	}

	:global(.editor) {
		height: 22rem;
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
