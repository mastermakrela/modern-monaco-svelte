import type { Workspace } from 'modern-monaco';
import { describe, expect, it } from 'vitest';
import { listWorkspaceFiles, WorkspaceState, workspacePath } from '../../lib/workspace.svelte.js';

describe('workspacePath', () => {
	it('strips file:/// URIs to bare paths', () => {
		expect(workspacePath('file:///a.md')).toBe('a.md');
		expect(workspacePath('file:///src/main.ts')).toBe('src/main.ts');
	});

	it('decodes percent-encoded characters', () => {
		expect(workspacePath('file:///my%20notes.md')).toBe('my notes.md');
	});

	it('strips a leading slash from plain paths', () => {
		expect(workspacePath('/a.md')).toBe('a.md');
		expect(workspacePath('a.md')).toBe('a.md');
		expect(workspacePath('')).toBe('');
	});
});

/** Builds a mock FileSystem from a directory-tree description. */
function mockFs(tree: Record<string, [string, number][]>) {
	return {
		readDirectory: async (dir: string) => tree[dir] ?? []
	};
}

const FILE = 1;
const DIR = 2;

describe('listWorkspaceFiles', () => {
	it('lists root files sorted', async () => {
		const fs = mockFs({
			'/': [
				['readme.md', FILE],
				['index.html', FILE]
			]
		});
		expect(await listWorkspaceFiles(fs)).toEqual(['index.html', 'readme.md']);
	});

	it('recurses into directories and prefixes paths', async () => {
		const fs = mockFs({
			'/': [
				['src', DIR],
				['readme.md', FILE]
			],
			src: [
				['main.ts', FILE],
				['lib', DIR]
			],
			'src/lib': [['util.ts', FILE]]
		});
		expect(await listWorkspaceFiles(fs)).toEqual(['readme.md', 'src/lib/util.ts', 'src/main.ts']);
	});

	it('ignores entries that are neither files nor directories', async () => {
		const fs = mockFs({
			'/': [
				['link', 64],
				['file.txt', FILE]
			]
		});
		expect(await listWorkspaceFiles(fs)).toEqual(['file.txt']);
	});

	it('returns an empty list for an empty workspace', async () => {
		expect(await listWorkspaceFiles(mockFs({}))).toEqual([]);
	});
});

describe('WorkspaceState.refresh', () => {
	it('rescans when a change lands while a scan is already running', async () => {
		const names = ['a.md'];
		// like IndexedDB: the directory is read now, the result arrives later
		const readDirectory = async () => {
			const snapshot = names.map((name): [string, number] => [name, FILE]);
			await new Promise((resolve) => setTimeout(resolve, 0));
			return snapshot;
		};
		// the fake covers only what WorkspaceState touches
		const workspace = {
			history: { state: { current: '' }, onChange: () => () => {} },
			fs: { readDirectory, watch: () => () => {} }
		} as unknown as Workspace;

		const state = new WorkspaceState(workspace); // starts the first scan
		names.push('b.md'); // created after that scan read the directory
		await state.refresh();

		expect(state.files).toEqual(['a.md', 'b.md']);
	});
});
