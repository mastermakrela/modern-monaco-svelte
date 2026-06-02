import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MonacoEditor from '../../lib/MonacoEditor.svelte';
import { preloadMonaco } from '../../lib/monaco.js';
import type { MonacoCodeEditor } from '../../lib/types.js';
import MonacoHost from './fixtures/MonacoHost.svelte';

// modern-monaco can only switch between themes registered at init time, and
// init is page-global — register every theme used anywhere in this file
// before the first editor mounts.
await preloadMonaco({ themes: ['vitesse-dark', 'vitesse-light'] });

interface MonacoHostApi {
	getValue(): string;
	setValue(next: string): void;
	getEditor(): MonacoCodeEditor | undefined;
	setTheme(next: string): void;
	setLanguage(next: string): void;
}

/** Renders the host fixture; `component` is cast to its exported functions. */
function renderHost(props: Record<string, unknown> = {}) {
	const screen = render(MonacoHost, props);
	return { screen, host: screen.component as unknown as MonacoHostApi };
}

async function waitForEditor(host: MonacoHostApi): Promise<MonacoCodeEditor> {
	return await vi.waitFor(
		() => {
			const editor = host.getEditor();
			if (!editor) throw new Error('editor not ready yet');
			return editor;
		},
		{ timeout: 25_000, interval: 100 }
	);
}

describe('MonacoEditor', () => {
	it('creates an editor with the initial value', async () => {
		const { host } = renderHost({ initial: 'hello world' });
		const editor = await waitForEditor(host);

		expect(editor.getValue()).toBe('hello world');
		expect(document.querySelector('.monaco-editor')).not.toBeNull();
	});

	it('propagates editor edits to the bound value', async () => {
		const { host } = renderHost({ initial: 'world' });
		const editor = await waitForEditor(host);

		editor.trigger('test', 'type', { text: 'hello ' });

		await vi.waitFor(() => {
			expect(host.getValue()).toBe('hello world');
		});
		expect(host.getValue()).toBe(editor.getValue());
	});

	it('applies external value changes to the editor', async () => {
		const { host } = renderHost({ initial: 'before' });
		const editor = await waitForEditor(host);

		host.setValue('after');

		await vi.waitFor(() => {
			expect(editor.getValue()).toBe('after');
		});
	});

	it('calls onready with the editor and monaco namespace', async () => {
		const onready = vi.fn();
		const { host } = renderHost({ initial: '', onready });
		const editor = await waitForEditor(host);

		expect(onready).toHaveBeenCalledTimes(1);
		expect(onready.mock.calls[0][0]).toBe(editor);
		expect(onready.mock.calls[0][1]).toHaveProperty('editor');
		expect(onready.mock.calls[0][1]).toHaveProperty('Range');
	});

	it('switches themes reactively', async () => {
		const { host } = renderHost({
			initial: 'theme test',
			theme: 'vitesse-dark',
			themes: ['vitesse-light']
		});
		await waitForEditor(host);

		const editorEl = () => document.querySelector('.monaco-editor') as HTMLElement;
		const before = getComputedStyle(editorEl()).backgroundColor;

		host.setTheme('vitesse-light');

		await vi.waitFor(() => {
			expect(getComputedStyle(editorEl()).backgroundColor).not.toBe(before);
		});
	});

	it('switches the model language reactively', async () => {
		const { host } = renderHost({ initial: '# hi', language: 'plaintext' });
		const editor = await waitForEditor(host);
		expect(editor.getModel()?.getLanguageId()).toBe('plaintext');

		host.setLanguage('markdown');

		await vi.waitFor(() => {
			expect(editor.getModel()?.getLanguageId()).toBe('markdown');
		});
	});

	it('renders a hidden form input kept in sync with the value', async () => {
		const direct = render(MonacoEditor, { name: 'content', value: 'form text' });

		const input = document.querySelector<HTMLInputElement>('input[name="content"]');
		expect(input).not.toBeNull();
		expect(input!.value).toBe('form text');
		direct.unmount();
	});

	it('cleans up the editor on unmount', async () => {
		const { screen, host } = renderHost({ initial: 'bye' });
		await waitForEditor(host);

		screen.unmount();

		expect(document.querySelector('.monaco-editor')).toBeNull();
	});
});
