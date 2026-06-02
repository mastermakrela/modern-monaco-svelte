import { Workspace } from 'modern-monaco';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { preloadMonaco } from '../../lib/monaco.js';
import type { MonacoCodeEditor } from '../../lib/types.js';
import WorkspaceHost from './fixtures/WorkspaceHost.svelte';

// Simulates SPA navigation: another page already initialized monaco WITHOUT
// a workspace, then a workspace-backed editor mounts later.
await preloadMonaco({ themes: ['vitesse-dark'] });

describe('MonacoEditor with a workspace mounted after init', () => {
	it('attaches the workspace late and opens the entry file without warnings', async () => {
		const warn = vi.spyOn(console, 'warn');

		const workspace = new Workspace({
			name: `test-${crypto.randomUUID()}`,
			initialFiles: { 'late.md': '# attached late' },
			entryFile: 'late.md'
		});

		const screen = render(WorkspaceHost, { workspace });
		const host = screen.component as unknown as {
			getEditor(): MonacoCodeEditor | undefined;
			getValue(): string;
		};

		const editor = await vi.waitFor(
			() => {
				const candidate = host.getEditor();
				if (!candidate?.getModel()) throw new Error('editor/model not ready yet');
				return candidate;
			},
			{ timeout: 25_000, interval: 100 }
		);

		expect(editor.getValue()).toBe('# attached late');
		expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('already initialized'));
	});
});
