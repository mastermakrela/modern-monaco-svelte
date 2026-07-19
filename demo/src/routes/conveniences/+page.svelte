<script lang="ts">
	import { MonacoEditor } from 'modern-monaco-svelte';
	import type { InitOptions } from 'modern-monaco-svelte';
	import { ui } from '$lib/ui.svelte.js';

	let dragList = $state(
		[
			'Weekend chores — drag a line to reorder it:',
			'',
			'Water the plants',
			'Take out the recycling',
			'Vacuum the living room',
			'Call the plumber',
			'Buy groceries',
			''
		].join('\n')
	);

	let wordBased = $state(
		[
			'The zambezi river flows through six countries in southern Africa.',
			"Local guides call the river's rapids by name: zambezi rapids are",
			'notoriously difficult to navigate during the wet season, and every',
			'zambezi expedition plans its route around them.',
			'',
			'Start typing "zambez" below and press Ctrl+Space:',
			''
		].join('\n')
	);

	let formatMe = $state(
		[
			'function add(a: number, b: number) {',
			'return a + b;',
			'}',
			'',
			'const   result   =   add(2, 3);',
			''
		].join('\n')
	);

	// modern-monaco's `init()` is page-global — only the FIRST init call (or
	// any call before it resolves) actually takes effect, so every editor on
	// this page shares this exact `init` value. That's what registers the
	// `lsp.formatting` config the third section needs; passing the same
	// object from all three avoids the "late init options" warning even
	// though only the format-on-paste/type section relies on it.
	const editorInit: InitOptions = {
		lsp: {
			formatting: {
				tabSize: 2,
				insertSpaces: true,
				trimTrailingWhitespace: true,
				semicolon: 'insert'
			}
		}
	};
</script>

<section>
	<h2>Drag &amp; drop text</h2>
	<p>
		Select a line (or a whole selection), then drag it to a new spot in the list to reorder it —
		no cut/paste needed.
	</p>
	<MonacoEditor
		bind:value={dragList}
		language="plaintext"
		dark={ui.dark}
		init={editorInit}
		options={{ dragAndDrop: true }}
		class="editor"
	>
		{#snippet loading()}
			<p class="loading">Loading editor…</p>
		{/snippet}
	</MonacoEditor>
</section>

<section>
	<h2>Word-based suggestions</h2>
	<p>
		No language server is backing this editor — completions here fall back to words already
		present in the document. Start typing one of the repeated words above (try "zambez") and
		press <kbd>Ctrl</kbd>+<kbd>Space</kbd> to see it suggested.
	</p>
	<MonacoEditor
		bind:value={wordBased}
		language="plaintext"
		dark={ui.dark}
		init={editorInit}
		options={{ wordBasedSuggestions: 'currentDocument' }}
		class="editor"
	>
		{#snippet loading()}
			<p class="loading">Loading editor…</p>
		{/snippet}
	</MonacoEditor>
</section>

<section>
	<h2>Format on paste / format on type</h2>
	<p>
		This snippet is intentionally messy. Type a new line ending in <code>;</code> or
		<code>}</code>
		to trigger format-on-type, or select all (<kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>A</kbd>), cut, and
		paste it right back to trigger format-on-paste.
	</p>
	<MonacoEditor
		bind:value={formatMe}
		language="typescript"
		dark={ui.dark}
		init={editorInit}
		options={{ formatOnPaste: true, formatOnType: true }}
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

	kbd {
		font-family: inherit;
		font-size: 0.85em;
		padding: 0.1rem 0.35rem;
		border: 1px solid #8886;
		border-radius: 0.3rem;
		background: #8881;
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
