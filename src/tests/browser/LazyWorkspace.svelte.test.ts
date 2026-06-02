import { Workspace } from 'modern-monaco';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LazyMonacoEditor from '../../lib/LazyMonacoEditor.svelte';

// `lazy()` captures its workspace once per page, so the workspace scenario
// lives in its own test file (= its own iframe). A unique name keeps runs
// isolated from previously persisted IndexedDB state.
const workspace = new Workspace({
	name: `test-${crypto.randomUUID()}`,
	initialFiles: { 'note.md': '# from workspace' },
	entryFile: 'note.md'
});

describe('LazyMonacoEditor with a workspace', () => {
	it('opens the workspace file and reports external changes via onchange', async () => {
		const onchange = vi.fn();
		render(LazyMonacoEditor, { workspace, filename: 'note.md', onchange });

		await vi.waitFor(
			() => {
				// monaco renders spaces as NBSP in view lines
				const text = (
					document.querySelector('.monaco-editor .view-lines')?.textContent ?? ''
				).replaceAll('\u00a0', ' ');
				expect(text).toContain('from workspace');
			},
			{ timeout: 25_000, interval: 200 }
		);

		await workspace.fs.writeFile('note.md', '# changed');

		await vi.waitFor(() => {
			expect(onchange).toHaveBeenCalledWith('# changed');
		});
	});
});
