<script lang="ts">
	import { resolve } from '$app/paths';
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

	const demos = [
		{
			href: '/diff',
			title: 'Diff',
			text: 'Side-by-side diff editor with two-way binding on both sides.',
			reload: false
		},
		{
			href: '/workspace',
			title: 'Multi-file workspace',
			text: 'Virtual filesystem, reactive file explorer, VS Code-style prompts, history trail.',
			reload: false
		},
		{
			href: '/intellisense',
			title: 'IntelliSense',
			text: 'Go to definition, rename across files, quick fixes and inlay hints via the built-in LSP.',
			reload: true
		},
		{
			href: '/multi-cursor',
			title: 'Multi-cursor',
			text: 'Linked tag editing, workspace-wide occurrence highlighting, signature help.',
			reload: true
		},
		{
			href: '/themes',
			title: 'Theme switcher',
			text: 'Swap between a dozen Shiki themes live, on one editor.',
			reload: true
		},
		{
			href: '/visual-aids',
			title: 'Visual aids',
			text: 'Inline color swatches, Trojan Source detection, bracket and indent guides.',
			reload: false
		},
		{
			href: '/conveniences',
			title: 'Conveniences',
			text: 'Drag-and-drop text, word-based suggestions, format on paste and type.',
			reload: true
		},
		{
			href: '/lazy',
			title: 'Lazy + SSR',
			text: 'Server-rendered highlighting that hydrates into a live editor.',
			reload: true
		}
	] as const;
</script>

<div class="hero">
	<h1>Monaco editors, the Svelte way</h1>
	<p class="tagline">
		Drop-in Svelte 5 components for
		<a href="https://github.com/esm-dev/modern-monaco">modern-monaco</a>: code and markdown
		editors with Shiki highlighting, workspaces, lazy loading, and SSR.
	</p>
	<code class="install">bun add modern-monaco-svelte modern-monaco</code>
</div>

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

<section class="demo-index">
	<h2>More demos</h2>
	<div class="demo-grid">
		{#each demos as demo (demo.href)}
			<a
				href={resolve(demo.href)}
				class="demo-link"
				data-sveltekit-reload={demo.reload ? '' : undefined}
			>
				<span class="demo-title">{demo.title}</span>
				<span class="demo-text">{demo.text}</span>
			</a>
		{/each}
	</div>
</section>

<style>
	.hero {
		margin: 1rem 0 2.5rem;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 650;
		letter-spacing: -0.02em;
		margin: 0 0 0.5rem;
		text-wrap: balance;
	}

	.tagline {
		max-width: 60ch;
		margin: 0 0 1.25rem;
		color: var(--muted);
		line-height: 1.55;
	}

	.tagline a {
		color: var(--accent);
	}

	.install {
		display: inline-block;
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 0.85rem;
		padding: 0.5rem 0.85rem;
		border: 1px solid var(--border-strong);
		border-radius: 0.5rem;
		background: var(--surface);
		user-select: all;
	}

	section {
		margin-bottom: 2.5rem;
	}

	h2 {
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		margin: 0 0 0.25rem;
	}

	section > p {
		max-width: 70ch;
		margin: 0 0 0.75rem;
		color: var(--muted);
	}

	.lock {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
		margin-bottom: 0.75rem;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.lock input {
		accent-color: var(--accent);
	}

	:global(.editor) {
		height: 22rem;
		border: 1px solid var(--border-strong);
		border-radius: 0.5rem;
	}

	.loading {
		display: grid;
		place-items: center;
		height: 100%;
		margin: 0;
		color: var(--muted);
	}

	.demo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 0.25rem 1.5rem;
		margin-top: 0.75rem;
	}

	.demo-link {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.75rem 0.6rem;
		border-top: 1px solid var(--border);
		text-decoration: none;
		border-radius: 0.375rem;
		transition: background 150ms ease-out;
	}

	.demo-link:hover {
		background: var(--surface);
	}

	.demo-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text);
	}

	.demo-link:hover .demo-title {
		color: var(--accent);
	}

	.demo-text {
		font-size: 0.85rem;
		color: var(--muted);
		line-height: 1.45;
	}
</style>
