<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { MonacoEditor, WorkspaceState } from '$lib/index.js';
	import { Workspace } from 'modern-monaco';

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

<main>
	<header>
		<h1>Workspace / multi-file demo</h1>
		<a href={resolve('/')}>← init mode demo</a>
	</header>

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

			<MonacoEditor
				{workspace}
				file={explorer.current}
				followHistory
				theme="vitesse-dark"
				class="demo-editor"
			/>
		</div>
	{/if}
</main>

<style>
	main {
		max-width: 64rem;
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
		font: inherit;
	}

	.history {
		display: flex;
		gap: 0.25rem;
	}

	:global(.demo-editor) {
		height: 28rem;
		border: 1px solid #8884;
		border-radius: 0.5rem;
	}
</style>
