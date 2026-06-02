import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InitOptions } from '../../lib/types.js';

const { initMock, lazyMock } = vi.hoisted(() => ({
	initMock: vi.fn(async (options: unknown) => ({ __monaco: true, options })),
	lazyMock: vi.fn()
}));

vi.mock('modern-monaco', () => ({ init: initMock, lazy: lazyMock }));

/** Fresh copy of the module so singleton state resets between tests. */
async function loadModule() {
	vi.resetModules();
	return await import('../../lib/monaco.js');
}

describe('preloadMonaco', () => {
	beforeEach(() => {
		initMock.mockClear();
		// monaco.ts only checks `typeof window`, so a stub is enough in node
		vi.stubGlobal('window', {});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('throws outside the browser', async () => {
		const { preloadMonaco } = await loadModule();
		vi.unstubAllGlobals();
		expect(() => preloadMonaco()).toThrow(/browser-only/);
	});

	it('initializes once and returns the same promise', async () => {
		const { preloadMonaco } = await loadModule();
		const first = preloadMonaco();
		const second = preloadMonaco();
		expect(second).toBe(first);
		await first;
		expect(initMock).toHaveBeenCalledTimes(1);
	});

	it('merges options from callers that register before init resolves', async () => {
		const { preloadMonaco } = await loadModule();
		preloadMonaco({ themes: ['rose-pine-dawn'] });
		preloadMonaco({ themes: ['rose-pine-moon', 'rose-pine-dawn'], defaultTheme: 'rose-pine-dawn' });
		await preloadMonaco();

		expect(initMock).toHaveBeenCalledTimes(1);
		expect(initMock).toHaveBeenCalledWith({
			// caller themes first, then the always-registered default pair
			themes: ['rose-pine-dawn', 'rose-pine-moon', 'vitesse-dark', 'vitesse-light'],
			defaultTheme: 'rose-pine-dawn'
		});
	});

	it('warns and ignores options that arrive too late and ask for anything new', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { preloadMonaco } = await loadModule();
		await preloadMonaco({ themes: ['rose-pine-dawn'] });

		await preloadMonaco({ themes: ['too-late'] });

		expect(warn).toHaveBeenCalledWith(expect.stringContaining('already initialized'));
		expect(initMock).toHaveBeenCalledTimes(1);
		expect(initMock).toHaveBeenCalledWith({
			themes: ['rose-pine-dawn', 'vitesse-dark', 'vitesse-light']
		});
	});

	it('registers the default light/dark pair even without options', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { preloadMonaco } = await loadModule();
		await preloadMonaco();

		expect(initMock).toHaveBeenCalledWith({ themes: ['vitesse-dark', 'vitesse-light'] });

		// an editor following prefers-color-scheme can mount late without noise
		await preloadMonaco({ themes: ['vitesse-light', 'vitesse-dark'] });
		expect(warn).not.toHaveBeenCalled();
	});

	it('stays silent when late options are already covered by init', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { preloadMonaco } = await loadModule();
		await preloadMonaco({ themes: ['rose-pine-dawn'], langs: ['markdown'] });

		await preloadMonaco({ themes: ['rose-pine-dawn'] });
		await preloadMonaco({ langs: ['markdown'] });

		expect(warn).not.toHaveBeenCalled();
	});

	it('treats the bundled default theme as registered', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { preloadMonaco } = await loadModule();
		await preloadMonaco();

		await preloadMonaco({ themes: ['vitesse-dark'] });

		expect(warn).not.toHaveBeenCalled();
	});

	it('does not warn when a workspace arrives after init (handled via attachWorkspace)', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { preloadMonaco } = await loadModule();
		await preloadMonaco();

		const workspace = { setupMonaco: vi.fn() };
		await preloadMonaco({ workspace } as never);

		expect(warn).not.toHaveBeenCalled();
	});
});

describe('attachWorkspace', () => {
	beforeEach(() => {
		initMock.mockClear();
		vi.stubGlobal('window', {});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('wires a late workspace exactly once', async () => {
		const { attachWorkspace, preloadMonaco } = await loadModule();
		const monaco = await preloadMonaco();
		const workspace = { setupMonaco: vi.fn() };

		attachWorkspace(workspace as never, monaco);
		attachWorkspace(workspace as never, monaco);

		expect(workspace.setupMonaco).toHaveBeenCalledTimes(1);
		expect(workspace.setupMonaco).toHaveBeenCalledWith(monaco);
	});

	it('does not re-attach a workspace that went through init', async () => {
		const { attachWorkspace, preloadMonaco } = await loadModule();
		const workspace = { setupMonaco: vi.fn() };
		const monaco = await preloadMonaco({ workspace } as never);

		attachWorkspace(workspace as never, monaco);

		expect(workspace.setupMonaco).not.toHaveBeenCalled();
	});

	it('reports when the upstream attachment hook is missing', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { attachWorkspace, preloadMonaco } = await loadModule();
		const monaco = await preloadMonaco();

		attachWorkspace({} as never, monaco);

		expect(error).toHaveBeenCalledWith(expect.stringContaining('setupMonaco'));
	});
});

describe('ensureLazyEditor', () => {
	beforeEach(() => {
		lazyMock.mockClear();
		vi.stubGlobal('window', {});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('calls lazy() once with merged options', async () => {
		const { ensureLazyEditor } = await loadModule();
		ensureLazyEditor({ themes: ['vitesse-dark'] });
		ensureLazyEditor({ themes: ['vitesse-light'] });
		await ensureLazyEditor();

		expect(lazyMock).toHaveBeenCalledTimes(1);
		expect(lazyMock).toHaveBeenCalledWith({ themes: ['vitesse-dark', 'vitesse-light'] });
	});

	it('is independent from the preloadMonaco singleton', async () => {
		const { ensureLazyEditor, preloadMonaco } = await loadModule();
		await preloadMonaco({ themes: ['a'] });
		await ensureLazyEditor({ themes: ['b'] });

		expect(initMock).toHaveBeenCalledWith({ themes: ['a', 'vitesse-dark', 'vitesse-light'] });
		// lazy mode loads themes per element — no base pair injected
		expect(lazyMock).toHaveBeenCalledWith({ themes: ['b'] });
	});

	it('warns on late options that ask for anything new', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { ensureLazyEditor } = await loadModule();
		await ensureLazyEditor({ themes: ['vitesse-dark'] });

		await ensureLazyEditor({ themes: ['vitesse-dark'] });
		expect(warn).not.toHaveBeenCalled();

		await ensureLazyEditor({ themes: ['too-late'] });
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('already initialized'));
		expect(lazyMock).toHaveBeenCalledTimes(1);
	});

	it('still warns on a late workspace (lazy mode cannot attach late)', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { ensureLazyEditor } = await loadModule();
		await ensureLazyEditor();

		await ensureLazyEditor({ workspace: { setupMonaco: vi.fn() } } as never);

		expect(warn).toHaveBeenCalledWith(expect.stringContaining('already initialized'));
	});
});

describe('mergeInitOptions', () => {
	it('returns empty options for an empty list', async () => {
		const { mergeInitOptions } = await loadModule();
		expect(mergeInitOptions([])).toEqual({});
	});

	it('concatenates and deduplicates string themes and langs, preserving order', async () => {
		const { mergeInitOptions } = await loadModule();
		expect(
			mergeInitOptions([
				{ themes: ['a', 'b'], langs: ['markdown'] },
				{ themes: ['b', 'c'], langs: ['markdown', 'yaml'] }
			])
		).toEqual({ themes: ['a', 'b', 'c'], langs: ['markdown', 'yaml'] });
	});

	it('deduplicates URL entries by href', async () => {
		const { mergeInitOptions } = await loadModule();
		const url = 'https://example.com/theme.json';
		const merged = mergeInitOptions([
			{ themes: [new URL(url)] },
			{ themes: [new URL(url), 'extra'] }
		]);
		expect(merged.themes).toHaveLength(2);
		expect(merged.themes?.[1]).toBe('extra');
	});

	it('keeps non-string theme inputs even when repeated', async () => {
		const { mergeInitOptions } = await loadModule();
		const custom = { name: 'custom', colors: {} };
		const merged = mergeInitOptions([{ themes: [custom] }, { themes: [custom] }]);
		expect(merged.themes).toHaveLength(2);
	});

	it('uses the last defined value for scalar options', async () => {
		const { mergeInitOptions } = await loadModule();
		const lsp: InitOptions['lsp'] = { formatting: { tabSize: 2, insertSpaces: true } };
		expect(
			mergeInitOptions([
				{ defaultTheme: 'one', cdn: 'https://a.example' },
				{ defaultTheme: 'two', lsp },
				{ cdn: 'https://b.example' }
			])
		).toEqual({ defaultTheme: 'two', cdn: 'https://b.example', lsp });
	});
});
