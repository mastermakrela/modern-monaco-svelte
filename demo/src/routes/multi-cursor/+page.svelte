<script lang="ts">
	import { browser } from '$app/environment';
	import { MonacoEditor, WorkspaceState } from 'modern-monaco-svelte';
	import { Workspace } from 'modern-monaco';
	import type { EditorOptions } from 'modern-monaco-svelte';
	import { ui } from '$lib/ui.svelte.js';

	// Distinct IndexedDB name from every other demo workspace.
	const workspace = browser
		? new Workspace({
				name: 'modern-monaco-svelte-demo-multicursor',
				initialFiles: {
					'index.html': `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<!-- linkedEditing: click inside "title" below and rename it — the
		     matching closing tag updates live as you type -->
		<title>Multi-cursor demo</title>
	</head>
	<body>
		<!-- rename this <section> tag — the closing tag follows -->
		<section class="card">
			<header>
				<h1>Cursor playground</h1>
			</header>
			<!-- multi-cursor: select one "TODO" below, then press Cmd/Ctrl+D twice
			     to add the next two occurrences, and type a replacement for all three
			     at once. Or alt-click (multiCursorModifier) at the start of each line. -->
			<ul>
				<li>TODO: fix spacing</li>
				<li>TODO: check colors</li>
				<li>TODO: add icon</li>
			</ul>
		</section>
	</body>
</html>
`,
					'src/user.ts': `// occurrencesHighlight: 'multiFile' — put the cursor on \`UserRecord\`
// (or \`createUser\`) below, then open format.ts or main.ts: every
// occurrence across all open files lights up, not just this one.

export interface UserRecord {
	id: string;
	name: string;
	email: string;
}

export function createUser(id: string, name: string, email: string): UserRecord {
	return { id, name, email };
}
`,
					'src/format.ts': `import type { UserRecord } from './user.js';

export interface FormatOptions {
	uppercase?: boolean;
	includeEmail?: boolean;
}

// parameterHints: click right after the opening "(" below (or retype it)
// and use Tab/comma to move through the signature help popup.
export function formatUser(
	record: UserRecord,
	locale: string,
	options: FormatOptions,
	indent: number
): string {
	const pad = ' '.repeat(indent);
	const name = options.uppercase ? record.name.toUpperCase() : record.name;
	const email = options.includeEmail ? \` <\${record.email}>\` : '';
	return \`\${pad}\${name}\${email} (\${locale})\`;
}
`,
					'src/main.ts': `import { createUser } from './user.js';
import { formatUser } from './format.js';

// Try it:
// 1. Delete the closing ")" on the createUser(...) call below and retype
//    it — parameterHints shows id/name/email as you move between commas.
// 2. Put the cursor on \`UserRecord\` in user.ts, then switch to this file —
//    occurrencesHighlight: 'multiFile' highlights it here too.
const user = createUser('u_1', 'Ada Lovelace', 'ada@example.com');

const line = formatUser(user, 'en-US', { uppercase: false, includeEmail: true }, 2);

console.log(line);
`
				},
				entryFile: 'index.html'
			})
		: undefined;
	const explorer = workspace ? new WorkspaceState(workspace) : undefined;

	// multiCursorModifier is otherwise static — mirror it in a toggle so the
	// alt-click vs. cmd/ctrl-click behavior can actually be tried live.
	let modifier = $state<'alt' | 'ctrlCmd'>('alt');

	const options: EditorOptions = $derived({
		linkedEditing: true,
		occurrencesHighlight: 'multiFile',
		parameterHints: { enabled: true },
		multiCursorModifier: modifier
	});
</script>

<section>
	<h2>Multi-cursor & refactor-aware editing</h2>
	<p>
		A multi-file workspace wired up for tag-aware renaming, cross-file symbol highlighting, and
		signature help — plus the built-in ways to drop extra cursors.
	</p>

	<ul class="try-list">
		<li>
			<strong>Rename a tag</strong> (<code>linkedEditing</code>) — in <code>index.html</code>, edit
			the opening <code>&lt;title&gt;</code> or <code>&lt;section&gt;</code> tag name; its closing tag
			updates as you type.
		</li>
		<li>
			<strong>Cross-file highlight</strong> (<code>occurrencesHighlight: 'multiFile'</code>) — put
			the cursor on <code>UserRecord</code> in <code>src/user.ts</code>, then switch to
			<code>src/format.ts</code> or <code>src/main.ts</code>; every occurrence lights up across files.
		</li>
		<li>
			<strong>Signature help</strong> (<code>parameterHints</code>) — in <code>src/main.ts</code>,
			retype the parens on the <code>createUser(</code> or <code>formatUser(</code> calls to see the
			parameter popup track each argument.
		</li>
		<li>
			<strong>Multiple cursors</strong> — <kbd>Cmd/Ctrl+D</kbd> selects the next occurrence of the
			current selection (repeat to add more); <kbd>Alt+Shift</kbd>+drag makes a column selection.
			Adding a cursor with a mouse click uses the modifier below (<code>multiCursorModifier</code>).
		</li>
	</ul>

	<div class="modifier-toggle">
		<span>Extra cursor click:</span>
		<button class:active={modifier === 'alt'} onclick={() => (modifier = 'alt')}>
			Alt-click (default)
		</button>
		<button class:active={modifier === 'ctrlCmd'} onclick={() => (modifier = 'ctrlCmd')}>
			Cmd/Ctrl-click
		</button>
	</div>

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

			<MonacoEditor
				{workspace}
				file={explorer.current}
				followHistory
				dark={ui.dark}
				{options}
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

	.try-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin: 0 0 1rem;
		padding-left: 1.25rem;
		opacity: 0.9;
	}

	.try-list li {
		line-height: 1.4;
	}

	code {
		font-size: 0.85em;
		padding: 0.05rem 0.3rem;
		border-radius: 0.25rem;
		background: #8882;
	}

	kbd {
		font-size: 0.85em;
		padding: 0.05rem 0.35rem;
		border-radius: 0.25rem;
		border: 1px solid #8886;
		background: #8881;
	}

	.modifier-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.modifier-toggle button {
		font: inherit;
		cursor: pointer;
		padding: 0.3rem 0.6rem;
		border: 1px solid #8886;
		border-radius: 0.375rem;
		background: transparent;
		color: inherit;
	}

	.modifier-toggle button.active {
		border-color: #8884;
		background: #8882;
		font-weight: 600;
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

	:global(.editor) {
		height: 28rem;
		border: 1px solid #8884;
		border-radius: 0.5rem;
	}

	.loading {
		color: #888;
	}
</style>
