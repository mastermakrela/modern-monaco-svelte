<script lang="ts">
	import { browser } from '$app/environment';
	import { MonacoEditor, WorkspaceState } from 'modern-monaco-svelte';
	import { Workspace } from 'modern-monaco';
	import { ui } from '$lib/ui.svelte.js';

	// Workspaces live in IndexedDB — client-only. Files persist across reloads;
	// initialFiles only seed an empty workspace.
	const workspace = browser
		? new Workspace({
				name: 'modern-monaco-svelte-demo',
				initialFiles: {
					'README.md': '# Workspace demo\n\nPick a file on the left — the editor follows.\n',
					'notes/ideas.md': '- multi-file editing\n- history navigation\n',
					'src/hello.ts': 'export const hello = (name: string) => `Hello, ${name}!`;\n',
					'styles.css': 'body {\n\tfont-family: sans-serif;\n}\n'
				},
				entryFile: 'README.md'
			})
		: undefined;
	const explorer = workspace ? new WorkspaceState(workspace) : undefined;

	let newFileName = $state('');

	async function createFile(event: SubmitEvent) {
		event.preventDefault();
		const path = newFileName.trim();
		if (!workspace || !explorer || !path) return;
		await workspace.fs.writeFile(path, '');
		explorer.open(path);
		newFileName = '';
	}
</script>

<section>
	<h2>Workspace (multi-file)</h2>
	<p>
		A virtual filesystem (IndexedDB) with a reactive file explorer and history navigation. Pick a
		file — the editor follows, restoring per-file cursor and scroll.
	</p>

	{#if workspace && explorer}
		<div class="layout">
			<aside>
				<nav>
					{#each explorer.files as path (path)}
						<button class:active={path === explorer.current} onclick={() => explorer.open(path)}>
							{path}
						</button>
					{/each}
				</nav>
				<form onsubmit={createFile}>
					<input bind:value={newFileName} placeholder="new-file.md" aria-label="New file name" />
					<button type="submit">Add</button>
				</form>
				<div class="history">
					<button onclick={() => workspace.history.back()}>← back</button>
					<button onclick={() => workspace.history.forward()}>forward →</button>
				</div>
			</aside>

			<MonacoEditor {workspace} file={explorer.current} followHistory dark={ui.dark} class="editor" />
		</div>
	{:else}
		<p class="loading">Workspaces are browser-only — loading…</p>
	{/if}
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

	.layout {
		display: grid;
		grid-template-columns: 14rem 1fr;
		gap: 1rem;
	}

	aside {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	nav button {
		text-align: left;
		padding: 0.35rem 0.5rem;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		background: none;
		color: inherit;
		cursor: pointer;
		font: inherit;
	}

	nav button:hover {
		background: #8881;
	}

	nav button.active {
		border-color: #8884;
		background: #8882;
		font-weight: 600;
	}

	form {
		display: flex;
		gap: 0.25rem;
	}

	input {
		min-width: 0;
		flex: 1;
		padding: 0.3rem 0.5rem;
		border: 1px solid #8884;
		border-radius: 0.375rem;
		background: transparent;
		color: inherit;
		font: inherit;
	}

	.history {
		display: flex;
		gap: 0.25rem;
	}

	.history button,
	form button {
		font: inherit;
		cursor: pointer;
		padding: 0.3rem 0.5rem;
		border: 1px solid #8886;
		border-radius: 0.375rem;
		background: transparent;
		color: inherit;
	}

	:global(.editor) {
		height: 28rem;
		border: 1px solid #8884;
		border-radius: 0.5rem;
	}

	.loading {
		color: #888;
	}
</style>
