import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { MonacoCodeEditor } from '../../lib/types.js';
import MonacoHost from './fixtures/MonacoHost.svelte';

// No preloadMonaco here on purpose: the first mounted editor has no explicit
// theme, so it must register the light/dark pair itself.

interface HostApi {
	getEditor(): MonacoCodeEditor | undefined;
	setTheme(next: string): void;
}

async function waitForEditor(host: HostApi): Promise<MonacoCodeEditor> {
	return await vi.waitFor(
		() => {
			const editor = host.getEditor();
			if (!editor) throw new Error('editor not ready yet');
			return editor;
		},
		{ timeout: 25_000, interval: 100 }
	);
}

function editorBackground(): string {
	return getComputedStyle(document.querySelector('.monaco-editor') as HTMLElement).backgroundColor;
}

describe('default theming via prefers-color-scheme', () => {
	it('applies the theme matching the system preference and follows it', async () => {
		const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

		const screen = render(MonacoHost, { initial: 'system themed' });
		const host = screen.component as unknown as HostApi;
		await waitForEditor(host);

		const defaultBackground = editorBackground();
		screen.unmount();

		// an explicit theme matching the preference must look identical...
		const expected = render(MonacoHost, {
			initial: 'system themed',
			theme: systemDark ? 'vitesse-dark' : 'vitesse-light'
		});
		await waitForEditor(expected.component as unknown as HostApi);
		expect(editorBackground()).toBe(defaultBackground);
		expected.unmount();

		// ...and the opposite theme must differ
		const opposite = render(MonacoHost, {
			initial: 'system themed',
			theme: systemDark ? 'vitesse-light' : 'vitesse-dark'
		});
		await waitForEditor(opposite.component as unknown as HostApi);
		expect(editorBackground()).not.toBe(defaultBackground);
	});
});
