<script lang="ts">
	import { browser } from '$app/environment';
	import { MonacoEditor, WorkspaceState, type MonacoCodeEditor } from 'modern-monaco-svelte';
	import { Workspace } from 'modern-monaco';
	import { ui } from '$lib/ui.svelte.js';

	// Monaco's quick-input service (behind showInputBox/showQuickPick) needs a
	// focused editor; clicking a page button steals focus, so refocus first.
	let editor: MonacoCodeEditor | undefined = $state(undefined);
	function focusEditor() {
		editor?.focus();
	}

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

	/** `workspace.history` stores `file:///`-style URIs; strip that down to a bare path. */
	function toDisplayPath(uriOrPath: string): string {
		if (uriOrPath.startsWith('file://')) {
			return decodeURIComponent(new URL(uriOrPath).pathname).replace(/^\//, '');
		}
		return uriOrPath.replace(/^\//, '');
	}

	// `workspace.history.state` only exposes `{ readonly current: string }` — no
	// list or index — so the visited-file trail is reconstructed locally from
	// `onChange`: a jump to the trail's neighbor is treated as back/forward,
	// anything else is a new visit (which also drops the forward stack, same
	// as a real `push`). This covers every way this page mutates history
	// (open/back/forward/rename/remove), so it stays in sync in practice.
	const initialHistoryPath = workspace
		? toDisplayPath(workspace.history.state.current || workspace.entryFile || '')
		: '';
	const initialHistoryTrail = initialHistoryPath ? [initialHistoryPath] : [];
	let historyTrail: string[] = $state(initialHistoryTrail);
	let historyIndex = $state(initialHistoryTrail.length ? 0 : -1);

	$effect(() => {
		if (!workspace) return;
		return workspace.history.onChange((state) => {
			const path = state.current ? toDisplayPath(state.current) : '';
			if (!path || historyTrail[historyIndex] === path) return;
			if (historyTrail[historyIndex + 1] === path) {
				historyIndex += 1;
			} else if (historyIndex > 0 && historyTrail[historyIndex - 1] === path) {
				historyIndex -= 1;
			} else {
				historyTrail = [...historyTrail.slice(0, historyIndex + 1), path];
				historyIndex = historyTrail.length - 1;
			}
		});
	});

	function goBack() {
		workspace?.history.back();
	}

	function goForward() {
		workspace?.history.forward();
	}

	/** No "jump to index" in the API — replay back()/forward() the right number of steps. */
	function goToTrailEntry(index: number) {
		if (!workspace || index === historyIndex) return;
		const steps = Math.abs(index - historyIndex);
		for (let i = 0; i < steps; i++) {
			if (index > historyIndex) workspace.history.forward();
			else workspace.history.back();
		}
	}

	async function createFile() {
		if (!workspace || !explorer) return;
		focusEditor();
		const path = await workspace.showInputBox({
			title: 'Create File',
			prompt: 'Path for the new file, relative to the workspace root',
			placeHolder: 'notes/todo.md',
			validateInput: (value) => {
				const trimmed = toDisplayPath(value.trim());
				if (!trimmed) return 'Enter a file path.';
				if (explorer.files.includes(trimmed)) return 'A file with that path already exists.';
				return undefined;
			}
		});
		if (!path) return;
		try {
			await explorer.create(path.trim());
		} catch (err) {
			console.error(err);
		}
	}

	async function renameFile(path: string) {
		if (!workspace || !explorer) return;
		focusEditor();
		const newPath = await workspace.showInputBox({
			title: 'Rename File',
			prompt: `Rename "${path}" to…`,
			value: path,
			valueSelection: [0, path.length],
			validateInput: (value) => {
				const trimmed = toDisplayPath(value.trim());
				if (!trimmed) return 'Enter a file path.';
				if (trimmed !== path && explorer.files.includes(trimmed)) {
					return 'A file with that path already exists.';
				}
				return undefined;
			}
		});
		if (!newPath || newPath.trim() === path) return;
		try {
			await explorer.rename(path, newPath.trim());
		} catch (err) {
			console.error(err);
		}
	}

	async function removeFile(path: string) {
		if (!workspace || !explorer) return;
		focusEditor();
		const deleteLabel = `Delete "${path}"`;
		const confirmed = await workspace.showQuickPick(['Cancel', deleteLabel], {
			title: 'Delete File',
			placeHolder: `Delete "${path}"? This cannot be undone.`
		});
		if (confirmed !== deleteLabel) return;
		try {
			await explorer.remove(path);
		} catch (err) {
			console.error(err);
		}
	}

	async function goToFile() {
		if (!workspace || !explorer) return;
		focusEditor();
		const picked = await workspace.showQuickPick(explorer.files, {
			title: 'Go to File',
			placeHolder: 'Search files…',
			matchOnDescription: true
		});
		if (picked) explorer.open(picked);
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
						<div class="file-row">
							<button
								class="file-open"
								class:active={path === explorer.current}
								onclick={() => explorer.open(path)}
							>
								{path}
							</button>
							<button
								class="file-action"
								title="Rename {path}"
								aria-label="Rename {path}"
								onclick={() => renameFile(path)}
							>
								Rename
							</button>
							<button
								class="file-action"
								title="Remove {path}"
								aria-label="Remove {path}"
								onclick={() => removeFile(path)}
							>
								Remove
							</button>
						</div>
					{/each}
				</nav>

				<div class="toolbar">
					<button onclick={createFile}>+ New file…</button>
					<button onclick={goToFile}>Go to file…</button>
				</div>

				<div class="history">
					<div class="history-buttons">
						<button onclick={goBack} disabled={historyIndex <= 0}>← back</button>
						<button onclick={goForward} disabled={historyIndex >= historyTrail.length - 1}>
							forward →
						</button>
					</div>
					<ol class="trail">
						{#each historyTrail as path, index (index)}
							<li>
								<button class:active={index === historyIndex} onclick={() => goToTrailEntry(index)}>
									{path}
								</button>
							</li>
						{/each}
					</ol>
				</div>
			</aside>

			<MonacoEditor
				{workspace}
				file={explorer.current}
				followHistory
				dark={ui.dark}
				bind:editor
				class="editor"
			/>
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
		grid-template-columns: 16rem 1fr;
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

	.file-row {
		position: relative;
		display: flex;
		align-items: stretch;
	}

	/* Rename/Remove overlay the row's right edge only while the row is
	   hovered or holds keyboard focus, so file names get the full width. */
	.file-row .file-action {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		opacity: 0;
		pointer-events: none;
	}

	.file-row .file-action:nth-of-type(2) {
		right: 3.6rem;
	}

	.file-row .file-action:nth-of-type(3) {
		right: 0.15rem;
	}

	.file-row:hover .file-action,
	.file-row:focus-within .file-action {
		opacity: 1;
		pointer-events: auto;
	}

	.file-open {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: left;
		padding: 0.35rem 0.5rem;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		background: none;
		color: inherit;
		cursor: pointer;
		font: inherit;
	}

	.file-open:hover {
		background: #8881;
	}

	.file-open.active {
		border-color: #8884;
		background: #8882;
		font-weight: 600;
	}

	.file-action {
		flex-shrink: 0;
		padding: 0.35rem 0.4rem;
		border: 1px solid #8884;
		border-radius: 0.375rem;
		background: var(--bg, #121314);
		color: inherit;
		cursor: pointer;
		font: inherit;
		font-size: 0.75rem;
	}

	.file-action:hover {
		background: var(--surface, #191b1c);
	}

	.toolbar {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.toolbar button {
		text-align: left;
		font: inherit;
		cursor: pointer;
		padding: 0.3rem 0.5rem;
		border: 1px solid #8886;
		border-radius: 0.375rem;
		background: transparent;
		color: inherit;
	}

	.history {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.history-buttons {
		display: flex;
		gap: 0.25rem;
	}

	.history-buttons button {
		font: inherit;
		cursor: pointer;
		padding: 0.3rem 0.5rem;
		border: 1px solid #8886;
		border-radius: 0.375rem;
		background: transparent;
		color: inherit;
	}

	.history-buttons button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.trail {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin: 0;
		padding: 0;
		list-style: none;
		max-height: 8rem;
		overflow-y: auto;
	}

	.trail li {
		display: flex;
	}

	.trail button {
		width: 100%;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: left;
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
		padding: 0.2rem 0.4rem;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		background: none;
		color: inherit;
		opacity: 0.7;
	}

	.trail button:hover {
		opacity: 1;
		background: #8881;
	}

	.trail button.active {
		opacity: 1;
		border-color: #8884;
		background: #8882;
		font-weight: 600;
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
