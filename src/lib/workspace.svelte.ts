import { NotFoundError, type Workspace } from 'modern-monaco/workspace';
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

/** Whether `path` currently exists in `fs` (`false` rather than throwing when it's absent). */
async function pathExists(fs: Workspace['fs'], path: string): Promise<boolean> {
	try {
		await fs.stat(path);
		return true;
	} catch (err) {
		if (err instanceof NotFoundError) return false;
		throw err;
	}
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
	#refreshing: Promise<void> | undefined;

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

	/** Re-reads the file list from the filesystem. Concurrent calls share one scan. */
	async refresh(): Promise<void> {
		this.#refreshing ??= listWorkspaceFiles(this.#workspace.fs)
			.then((files) => {
				this.files = files;
			})
			.finally(() => {
				this.#refreshing = undefined;
			});
		return this.#refreshing;
	}

	/** Opens a file by pushing it onto the workspace history. */
	open(path: string): void {
		if (workspacePath(this.#workspace.history.state.current ?? '') !== path) {
			this.#workspace.history.push(path);
		}
		this.current = path;
	}

	/**
	 * Creates a new file (and any missing parent directories), then opens it.
	 * Throws if `path` already exists — use `workspace.fs.writeFile` directly
	 * to overwrite intentionally.
	 */
	async create(path: string, content: string = ''): Promise<void> {
		const target = workspacePath(path);
		const fs = this.#workspace.fs;
		const slashIndex = target.lastIndexOf('/');
		const dir = slashIndex === -1 ? '' : target.slice(0, slashIndex);

		// independent checks — run them concurrently instead of round-tripping twice
		const [targetExists, dirExists] = await Promise.all([
			pathExists(fs, target),
			dir ? pathExists(fs, dir) : Promise.resolve(true)
		]);
		if (targetExists) throw new Error(`File already exists: ${target}`);
		if (dir && !dirExists) await fs.createDirectory(dir);

		await fs.writeFile(target, content);
		this.open(target);
	}

	/**
	 * Renames/moves a file, fixing up `current` and `workspace.history` in
	 * place when the renamed file is the one currently open.
	 */
	async rename(
		oldPath: string,
		newPath: string,
		options: { overwrite?: boolean } = {}
	): Promise<void> {
		const from = workspacePath(oldPath);
		const to = workspacePath(newPath);
		await this.#workspace.fs.rename(from, to, { overwrite: options.overwrite ?? false });

		if (from === this.current) {
			this.current = to;
			this.#workspace.history.replace(to);
		}
	}

	/**
	 * Deletes a file (or, with `recursive`, a directory). If it was the open
	 * file, `current` moves to wherever `workspace.history.back()` lands (if
	 * that file still exists) or otherwise the first remaining file.
	 */
	async remove(path: string, options: { recursive?: boolean } = {}): Promise<void> {
		const target = workspacePath(path);
		await this.#workspace.fs.delete(target, { recursive: options.recursive ?? false });
		if (target !== this.current) return;

		const history = this.#workspace.history;
		history.back();
		await this.refresh();

		const backTarget = workspacePath(history.state.current ?? '');
		this.current =
			backTarget && backTarget !== target && this.files.includes(backTarget)
				? backTarget
				: this.files[0];
	}

	dispose(): void {
		this.#cleanups.forEach((cleanup) => cleanup());
		this.#cleanups = [];
	}
}
