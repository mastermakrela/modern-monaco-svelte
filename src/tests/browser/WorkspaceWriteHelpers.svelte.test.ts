import { Workspace } from 'modern-monaco';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceState, workspacePath } from '../../lib/workspace.svelte.js';

// Each test gets its own workspace — a unique name keeps runs isolated from
// previously persisted IndexedDB state.
function createWorkspace(initialFiles: Record<string, string>, entryFile: string) {
	return new Workspace({
		name: `test-write-${crypto.randomUUID()}`,
		initialFiles,
		entryFile
	});
}

describe('WorkspaceState write helpers', () => {
	it('create() makes missing parent directories and opens the file', async () => {
		const workspace = createWorkspace({ 'a.md': '# a' }, 'a.md');
		const state = new WorkspaceState(workspace);
		try {
			await vi.waitFor(() => expect(state.files).toContain('a.md'));

			await state.create('nested/deep/new.md', '# new');

			expect(state.current).toBe('nested/deep/new.md');
			expect(await workspace.fs.readTextFile('nested/deep/new.md')).toBe('# new');
			await vi.waitFor(() => expect(state.files).toContain('nested/deep/new.md'));
		} finally {
			state.dispose();
		}
	});

	it('create() at the top level does not create a spurious directory entry', async () => {
		const workspace = createWorkspace({ 'a.md': '# a' }, 'a.md');
		const state = new WorkspaceState(workspace);
		try {
			await vi.waitFor(() => expect(state.files).toContain('a.md'));

			await state.create('new.md', '# new');

			expect(state.current).toBe('new.md');
			expect(await workspace.fs.readTextFile('new.md')).toBe('# new');
			await vi.waitFor(() => expect(state.files).toContain('new.md'));
			expect(state.files).toEqual(['a.md', 'new.md']);
			const entries = await workspace.fs.readDirectory('/');
			expect(entries.map(([name]: [string, number]) => name).sort()).toEqual(['a.md', 'new.md']);
		} finally {
			state.dispose();
		}
	});

	it('create() rejects when the path already exists', async () => {
		const workspace = createWorkspace({ 'a.md': '# a' }, 'a.md');
		const state = new WorkspaceState(workspace);
		try {
			await vi.waitFor(() => expect(state.files).toContain('a.md'));

			await expect(state.create('a.md', 'clobber')).rejects.toThrow();
			expect(await workspace.fs.readTextFile('a.md')).toBe('# a');
		} finally {
			state.dispose();
		}
	});

	it('rename() of the open file updates current and history', async () => {
		const workspace = createWorkspace({ 'a.md': '# a', 'b.md': '# b' }, 'a.md');
		const state = new WorkspaceState(workspace);
		try {
			await vi.waitFor(() => expect(state.files).toContain('a.md'));
			state.open('a.md');

			await state.rename('a.md', 'renamed.md');

			expect(state.current).toBe('renamed.md');
			expect(workspacePath(workspace.history.state.current)).toBe('renamed.md');
			await vi.waitFor(() => expect(state.files).toContain('renamed.md'));
			expect(state.files).not.toContain('a.md');
		} finally {
			state.dispose();
		}
	});

	it('rename() of a file that is not open leaves current untouched', async () => {
		const workspace = createWorkspace({ 'a.md': '# a', 'b.md': '# b' }, 'a.md');
		const state = new WorkspaceState(workspace);
		try {
			await vi.waitFor(() => expect(state.files).toContain('b.md'));
			state.open('a.md');

			await state.rename('b.md', 'renamed-b.md');

			expect(state.current).toBe('a.md');
			await vi.waitFor(() => expect(state.files).toContain('renamed-b.md'));
		} finally {
			state.dispose();
		}
	});

	it('remove() of the open file switches current to a remaining file', async () => {
		const workspace = createWorkspace({ 'a.md': '# a', 'b.md': '# b' }, 'a.md');
		const state = new WorkspaceState(workspace);
		try {
			await vi.waitFor(() => expect(state.files).toContain('b.md'));
			state.open('b.md');

			await state.remove('b.md');

			await vi.waitFor(() => expect(state.files).not.toContain('b.md'));
			expect(state.current).not.toBe('b.md');
			expect(state.current).toBeDefined();
			expect(state.files).toContain(state.current);
		} finally {
			state.dispose();
		}
	});

	it('remove() of a file that is not open leaves current untouched', async () => {
		const workspace = createWorkspace({ 'a.md': '# a', 'b.md': '# b' }, 'a.md');
		const state = new WorkspaceState(workspace);
		try {
			await vi.waitFor(() => expect(state.files).toContain('b.md'));
			state.open('a.md');

			await state.remove('b.md');

			expect(state.current).toBe('a.md');
			await vi.waitFor(() => expect(state.files).not.toContain('b.md'));
		} finally {
			state.dispose();
		}
	});
});
