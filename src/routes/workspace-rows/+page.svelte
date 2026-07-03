<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { MonacoEditor, WorkspaceState } from '$lib/index.js';
	import { Workspace } from 'modern-monaco';

	interface DbRow {
		uuid: string;
		name: string;
		content: string;
	}

	function isDbRow(value: unknown): value is DbRow {
		return (
			!!value &&
			typeof value === 'object' &&
			typeof (value as DbRow).uuid === 'string' &&
			typeof (value as DbRow).name === 'string' &&
			typeof (value as DbRow).content === 'string'
		);
	}

	// Stand-in for rows fetched from a database — anything shaped like
	// { uuid, name, content } can be rendered and edited as a workspace.
	let rows: DbRow[] = $state([
		{
			uuid: '1',
			name: 'README.md',
			content:
				'# From the database\n\nEach row is a file: `uuid`, `name`, `content`.\nEdit here or in the JSON box below — both stay in sync.\n'
		},
		{ uuid: '2', name: 'src/index.ts', content: 'export const rowId = "2";\n' },
		{ uuid: '3', name: 'notes.txt', content: 'A third row, rendered as a third file.\n' }
	]);

	// Workspaces live in IndexedDB — client-only. Files persist across reloads;
	// initialFiles only seed an empty workspace (a returning row's `content`
	// may lag behind whatever was left in IndexedDB until you edit it).
	const workspace = browser
		? new Workspace({
				name: 'modern-monaco-svelte-demo-db-rows',
				initialFiles: Object.fromEntries(rows.map((row) => [row.name, row.content])),
				entryFile: rows[0]?.name
			})
		: undefined;
	const explorer = workspace ? new WorkspaceState(workspace) : undefined;

	// What we last wrote per uuid, so re-applying identical JSON is a no-op —
	// only actual creates/renames/deletes/edits touch the filesystem.
	let appliedByUuid = new Map(
		rows.map((row) => [row.uuid, { path: row.name, content: row.content }])
	);

	let openValue = $state('');
	let jsonText = $state(JSON.stringify(rows, null, 2));
	let jsonFocused = $state(false);
	let jsonError: string | undefined = $state(undefined);

	const preview = $derived(JSON.stringify(rows, null, 2));

	// Debounced: parse the JSON box and push the diff into the workspace.
	$effect(() => {
		const text = jsonText;
		const timer = setTimeout(() => void applyJson(text), 400);
		return () => clearTimeout(timer);
	});

	async function applyJson(text: string) {
		if (!workspace || !explorer) return;
		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch {
			jsonError = 'Invalid JSON';
			return;
		}
		if (!Array.isArray(parsed) || !parsed.every(isDbRow)) {
			jsonError = 'Expected an array of { uuid, name, content }';
			return;
		}
		jsonError = undefined;
		await syncWorkspace(parsed);
		rows = parsed;
		if (explorer.current && !parsed.some((row) => row.name === explorer.current)) {
			explorer.open(parsed[0]?.name ?? '');
		}
	}

	async function syncWorkspace(newRows: DbRow[]) {
		if (!workspace) return;
		const newByUuid = new Map(newRows.map((row) => [row.uuid, row]));

		for (const [uuid, prev] of appliedByUuid) {
			if (!newByUuid.has(uuid)) {
				await workspace.fs.delete(prev.path).catch(() => {});
			}
		}

		for (const row of newRows) {
			const prev = appliedByUuid.get(row.uuid);
			if (!prev || prev.path !== row.name || prev.content !== row.content) {
				if (prev && prev.path !== row.name) {
					await workspace.fs.delete(prev.path).catch(() => {});
				}
				// the workspace pushes this into the live model if that file is open
				await workspace.fs.writeFile(row.name, row.content);
			}
		}

		appliedByUuid = new Map(
			newRows.map((row) => [row.uuid, { path: row.name, content: row.content }])
		);
	}

	// The open file's content flows back into its row (and the preview).
	$effect(() => {
		const value = openValue;
		const path = explorer?.current;
		if (path === undefined) return;
		const row = rows.find((r) => r.name === path);
		if (row && row.content !== value) {
			row.content = value;
			const applied = appliedByUuid.get(row.uuid);
			if (applied) applied.content = value;
			if (!jsonFocused) jsonText = JSON.stringify(rows, null, 2);
		}
	});
</script>

<main>
	<header>
		<h1>Workspace from DB rows</h1>
		<a href={resolve('/workspace')}>← workspace demo</a>
	</header>

	<p>
		Any array of <code>{'{ uuid, name, content }'}</code> objects — e.g. rows from a table — can
		back a workspace: <code>name</code> becomes the file path, <code>content</code> its text, and
		<code>uuid</code> tracks the row across renames. Edit a file in the editor or edit the JSON directly
		— both sides stay live.
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
			</aside>

			<!-- no theme prop: follows the system's prefers-color-scheme -->
			<MonacoEditor
				{workspace}
				file={explorer.current}
				bind:value={openValue}
				followHistory
				class="demo-editor"
			/>
		</div>

		<div class="json-panel">
			<label for="rows-json">Rows (editable JSON)</label>
			<textarea
				id="rows-json"
				bind:value={jsonText}
				onfocus={() => (jsonFocused = true)}
				onblur={() => {
					jsonFocused = false;
					jsonText = JSON.stringify(rows, null, 2);
				}}
				spellcheck="false"
			></textarea>
			{#if jsonError}
				<p class="error">{jsonError}</p>
			{/if}
		</div>

		<details open>
			<summary>Live preview (derived from the workspace)</summary>
			<pre>{preview}</pre>
		</details>
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

	p {
		margin: 0 0 1rem;
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

	:global(.demo-editor) {
		height: 20rem;
		border: 1px solid #8884;
		border-radius: 0.5rem;
	}

	.json-panel {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-top: 1rem;
	}

	.json-panel label {
		font-size: 0.85rem;
		opacity: 0.8;
	}

	textarea {
		width: 100%;
		min-height: 10rem;
		box-sizing: border-box;
		padding: 0.75rem;
		border: 1px solid #8884;
		border-radius: 0.5rem;
		font:
			0.85rem/1.4 ui-monospace,
			monospace;
		resize: vertical;
	}

	.error {
		margin: 0;
		color: #d33;
		font-size: 0.85rem;
	}

	details {
		margin-top: 1rem;
	}

	pre {
		background: #8881;
		padding: 1rem;
		border-radius: 0.5rem;
		white-space: pre-wrap;
		overflow-x: auto;
	}
</style>
