import type { Workspace } from 'modern-monaco';
import type { IDisposable } from './types.js';

/** The subset of modern-monaco's `FileSystem` needed to list files. */
interface ListableFileSystem {
	readDirectory(dir: string): Promise<[string, number][]>;
}

/**
 * Normalizes a workspace location to a bare file path: `file:///` URIs (as
 * stored by `workspace.history`) become `src/main.ts`-style paths; plain
 * paths just lose their leading slash.
 */
export function workspacePath(uriOrPath: string): string {
	if (uriOrPath.startsWith('file://')) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- throwaway parser, not reactive state
		return decodeURIComponent(new URL(uriOrPath).pathname).replace(/^\//, '');
	}
	return uriOrPath.replace(/^\//, '');
}

/**
 * Recursively lists all file paths in a workspace filesystem (sorted,
 * without a leading slash).
 */
export async function listWorkspaceFiles(
	fs: ListableFileSystem,
	dir: string = '/'
): Promise<string[]> {
	const entries = await fs.readDirectory(dir);
	const files: string[] = [];
	for (const [filename, type] of entries) {
		const path = dir === '/' ? filename : `${dir}/${filename}`;
		if (type === 2) {
			files.push(...(await listWorkspaceFiles(fs, path)));
		} else if (type === 1) {
			files.push(path);
		}
	}
	return files.sort();
}

/**
 * Reactive view of a workspace for building file trees, tab bars, etc. —
 * `files` tracks the filesystem (via `fs.watch`) and `current` tracks
 * `workspace.history`.
 *
 * Browser-only (workspaces live in IndexedDB); construct it where the
 * workspace is constructed. Call `dispose()` when done — or rely on
 * component teardown via `$effect`/`onDestroy` in the owning component.
 *
 * Pair with `<MonacoEditor {workspace} file={state.current} followHistory>`:
 * `open()` pushes a history entry, the editor follows it, and `current`
 * highlights the open file.
 */
export class WorkspaceState implements IDisposable {
	#workspace: Workspace;
	#cleanups: (() => void)[] = [];

	/** All file paths in the workspace (sorted), kept fresh via `fs.watch`. */
	files: string[] = $state([]);
	/** The current file from `workspace.history`. */
	current: string | undefined = $state(undefined);

	constructor(workspace: Workspace) {
		this.#workspace = workspace;
		const initial = workspace.history.state.current || workspace.entryFile;
		this.current = initial ? workspacePath(initial) : undefined;

		void this.refresh();
		this.#cleanups.push(
			workspace.fs.watch('/', { recursive: true }, (kind: 'create' | 'modify' | 'remove') => {
				if (kind === 'create' || kind === 'remove') void this.refresh();
			}),
			workspace.history.onChange((state: { readonly current: string }) => {
				if (state.current) this.current = workspacePath(state.current);
			})
		);
	}

	get workspace(): Workspace {
		return this.#workspace;
	}

	/** Re-reads the file list from the filesystem. */
	async refresh(): Promise<void> {
		this.files = await listWorkspaceFiles(this.#workspace.fs);
	}

	/** Opens a file by pushing it onto the workspace history. */
	open(path: string): void {
		if (workspacePath(this.#workspace.history.state.current ?? '') !== path) {
			this.#workspace.history.push(path);
		}
		this.current = path;
	}

	dispose(): void {
		this.#cleanups.forEach((cleanup) => cleanup());
		this.#cleanups = [];
	}
}
