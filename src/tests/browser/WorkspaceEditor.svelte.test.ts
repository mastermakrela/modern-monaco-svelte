import { Workspace } from 'modern-monaco';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { MonacoCodeEditor } from '../../lib/types.js';
import { WorkspaceState, workspacePath } from '../../lib/workspace.svelte.js';
import WorkspaceHost from './fixtures/WorkspaceHost.svelte';

// The workspace is part of the page-global init options, so this whole file
// shares one instance. A unique name keeps runs isolated from previously
// persisted IndexedDB state.
const workspace = new Workspace({
	name: `test-${crypto.randomUUID()}`,
	initialFiles: {
		'a.md': '# file a',
		'b.md': '# file b',
		'src/main.ts': 'console.log("main")'
	},
	entryFile: 'a.md'
});

interface WorkspaceHostApi {
	getEditor(): MonacoCodeEditor | undefined;
	getFile(): string | undefined;
	setFile(next: string): void;
	getValue(): string;
}

function renderHost(props: Record<string, unknown> = {}) {
	const screen = render(WorkspaceHost, { workspace, ...props });
	return { screen, host: screen.component as unknown as WorkspaceHostApi };
}

async function waitForModel(host: WorkspaceHostApi): Promise<MonacoCodeEditor> {
	return await vi.waitFor(
		() => {
			const editor = host.getEditor();
			if (!editor?.getModel()) throw new Error('editor/model not ready yet');
			return editor;
		},
		{ timeout: 25_000, interval: 100 }
	);
}

describe('MonacoEditor with a workspace', () => {
	it('opens the entry file by default', async () => {
		const { host } = renderHost();
		const editor = await waitForModel(host);

		expect(host.getFile()).toBe('a.md');
		expect(editor.getValue()).toBe('# file a');
		expect(editor.getModel()?.getLanguageId()).toBe('markdown');
		expect(host.getValue()).toBe('# file a');
	});

	it('switches files reactively and keeps edits across switches', async () => {
		const { host } = renderHost({ initialFile: 'a.md' });
		const editor = await waitForModel(host);

		// edit file a
		editor.trigger('test', 'type', { text: 'edit! ' });
		await vi.waitFor(() => {
			expect(host.getValue()).toContain('edit!');
		});

		// switch to b — bound value follows the new file
		host.setFile('b.md');
		await vi.waitFor(() => {
			expect(editor.getValue()).toBe('# file b');
		});
		expect(host.getValue()).toBe('# file b');

		// switch back — the edit is still there
		host.setFile('a.md');
		await vi.waitFor(() => {
			expect(editor.getValue()).toContain('edit!');
		});
	});

	it('derives the language from the open file', async () => {
		const { host } = renderHost({ initialFile: 'src/main.ts' });
		const editor = await waitForModel(host);

		await vi.waitFor(() => {
			expect(editor.getModel()?.getLanguageId()).toBe('typescript');
		});
	});

	it('follows workspace history navigation', async () => {
		const { host } = renderHost({ initialFile: 'a.md', followHistory: true });
		await waitForModel(host);

		workspace.history.push('b.md');

		await vi.waitFor(() => {
			expect(host.getFile()).toBe('b.md');
			expect(host.getEditor()?.getValue()).toBe('# file b');
		});

		workspace.history.back();

		await vi.waitFor(() => {
			expect(host.getFile()).toBe('a.md');
		});
	});
});

describe('WorkspaceState', () => {
	it('lists files, tracks history, and reacts to filesystem changes', async () => {
		const state = new WorkspaceState(workspace);
		try {
			await vi.waitFor(() => {
				expect(state.files).toContain('a.md');
				expect(state.files).toContain('src/main.ts');
			});

			state.open('b.md');
			expect(state.current).toBe('b.md');
			expect(workspacePath(workspace.history.state.current)).toBe('b.md');

			await workspace.fs.writeFile('new.md', '# new');
			await vi.waitFor(() => {
				expect(state.files).toContain('new.md');
			});

			await workspace.fs.delete('new.md');
			await vi.waitFor(() => {
				expect(state.files).not.toContain('new.md');
			});
		} finally {
			state.dispose();
		}
	});
});
