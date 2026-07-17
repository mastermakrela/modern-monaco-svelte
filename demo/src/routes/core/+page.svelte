<script lang="ts">
	import { onMount } from 'svelte';
	import { preloadMonacoCore, registerSyntax, registerTheme } from 'modern-monaco-svelte/core';
	import type { MonacoCodeEditor } from 'modern-monaco-svelte';
	import type { TextmateGrammar, TextmateTheme } from 'modern-monaco';

	// A hand-written grammar/theme pair — no CDN fetch, no bundled grammars.
	// Registering under the well-known "ini" language id (rather than a made-up
	// one) is what makes modern-monaco/core wire it into monaco's language
	// service; entirely novel ids are never auto-registered.
	const iniSyntax: TextmateGrammar = {
		name: 'ini',
		scopeName: 'source.ini',
		patterns: [{ include: '#comment' }, { include: '#section' }, { include: '#property' }],
		repository: {
			comment: {
				patterns: [{ name: 'comment.line.semicolon.ini', match: '((^|\\s)(;|#).*)' }]
			},
			section: {
				patterns: [
					{ name: 'entity.name.section.group-title.ini', match: '^\\s*(\\[)([^\\]]*)(\\])' }
				]
			},
			property: {
				patterns: [
					{
						match: '^\\s*([^=;#\\s][^=]*?)\\s*(=)\\s*(.*)$',
						captures: {
							'1': { name: 'keyword.other.definition.ini' },
							'2': { name: 'punctuation.separator.key-value.ini' },
							'3': { name: 'string.unquoted.ini' }
						}
					}
				]
			}
		}
	};

	const inkTheme: TextmateTheme = {
		name: 'core-demo-ink',
		type: 'dark',
		colors: {
			'editor.background': '#12151b',
			'editor.foreground': '#d7dce1'
		},
		tokenColors: [
			{
				scope: 'comment.line.semicolon.ini',
				settings: { foreground: '#6a7380', fontStyle: 'italic' }
			},
			{
				scope: 'entity.name.section.group-title.ini',
				settings: { foreground: '#ffcb6b', fontStyle: 'bold' }
			},
			{ scope: 'keyword.other.definition.ini', settings: { foreground: '#82aaff' } },
			{ scope: 'punctuation.separator.key-value.ini', settings: { foreground: '#89ddff' } },
			{ scope: 'string.unquoted.ini', settings: { foreground: '#c3e88d' } }
		]
	};

	// Register before the first preloadMonacoCore() call — init() resolves
	// languages/themes as soon as it runs.
	registerSyntax(iniSyntax);
	registerTheme(inkTheme);

	const value = [
		'; modern-monaco-svelte/core demo — no bundled grammars, no CDN fetch',
		'[server]',
		'host = localhost',
		'port = 8080',
		'',
		'[feature-flags]',
		'dark-mode = true'
	].join('\n');

	let container: HTMLDivElement | undefined = $state();
	let ready = $state(false);
	let editor: MonacoCodeEditor | undefined;

	onMount(() => {
		let disposed = false;
		(async () => {
			const m = await preloadMonacoCore({ defaultTheme: 'core-demo-ink' });
			if (disposed || !container) return;
			editor = m.editor.create(container, {
				value,
				language: 'ini',
				theme: 'core-demo-ink',
				automaticLayout: true
			});
			ready = true;
		})();

		return () => {
			disposed = true;
			editor?.dispose();
		};
	});
</script>

<section>
	<h2>modern-monaco/core (bundle-size-sensitive)</h2>
	<p>
		Uses <code>preloadMonacoCore</code> from <code>modern-monaco-svelte/core</code> (the ~16KB
		<code>modern-monaco/core</code> entry) with a hand-registered <code>ini</code> grammar and theme
		— no bundled grammars, no CDN fetch. The theme is registered manually, so it doesn't follow the
		<code>ui.dark</code> toggle above.
	</p>

	<div class="editor-wrap">
		<div class="editor" bind:this={container}></div>
		{#if !ready}
			<p class="loading">Loading editor…</p>
		{/if}
	</div>
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

	.editor-wrap {
		position: relative;
		height: 20rem;
		border: 1px solid #8884;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.editor {
		position: absolute;
		inset: 0;
	}

	.loading {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		margin: 0;
		color: #888;
	}
</style>
