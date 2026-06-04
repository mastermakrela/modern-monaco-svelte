import { describe, expect, it, vi } from 'vitest';
import { preloadMonaco } from '../../lib/monaco.js';
import type { MonacoDiffEditorInstance } from '../../lib/types.js';
import DiffHost from './fixtures/DiffHost.svelte';
import { render } from 'vitest-browser-svelte';

// init is page-global — register every theme used in this file up front.
await preloadMonaco({ themes: ['vitesse-dark', 'vitesse-light'] });

interface DiffHostApi {
	getModified(): string;
	setModified(next: string): void;
	setOriginal(next: string): void;
	getEditor(): MonacoDiffEditorInstance | undefined;
	setReadOnly(next: boolean): void;
}

function renderHost(props: Record<string, unknown> = {}) {
	const screen = render(DiffHost, props);
	return { screen, host: screen.component as unknown as DiffHostApi };
}

async function waitForEditor(host: DiffHostApi): Promise<MonacoDiffEditorInstance> {
	return await vi.waitFor(
		() => {
			const editor = host.getEditor();
			if (!editor?.getModel()) throw new Error('diff editor not ready yet');
			return editor;
		},
		{ timeout: 25_000, interval: 100 }
	);
}

describe('MonacoDiffEditor', () => {
	it('creates a diff editor with both sides populated', async () => {
		const { host } = renderHost({ original: 'line one', modified: 'line two' });
		const editor = await waitForEditor(host);

		expect(editor.getModel()?.original.getValue()).toBe('line one');
		expect(editor.getModel()?.modified.getValue()).toBe('line two');
		expect(document.querySelector('.monaco-diff-editor')).not.toBeNull();
	});

	it('applies external changes to each side', async () => {
		const { host } = renderHost({ original: 'a', modified: 'b' });
		const editor = await waitForEditor(host);

		host.setOriginal('a2');
		host.setModified('b2');

		await vi.waitFor(() => {
			expect(editor.getModel()?.original.getValue()).toBe('a2');
			expect(editor.getModel()?.modified.getValue()).toBe('b2');
		});
	});

	it('keeps the modified side read-only by default', async () => {
		const { host } = renderHost({ original: 'x', modified: 'y' });
		const editor = await waitForEditor(host);

		// typing is rejected while read-only (the default)
		editor.getModifiedEditor().trigger('test', 'type', { text: 'z' });
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(host.getModified()).toBe('y');
	});

	it('propagates edits to the bound modified value when editable', async () => {
		const { host } = renderHost({ original: 'orig', modified: 'world', readOnly: false });
		const editor = await waitForEditor(host);

		const modifiedEditor = editor.getModifiedEditor();
		modifiedEditor.setPosition({ lineNumber: 1, column: 1 });
		modifiedEditor.trigger('test', 'type', { text: 'hello ' });

		await vi.waitFor(() => {
			expect(host.getModified()).toBe('hello world');
		});
		expect(host.getModified()).toBe(modifiedEditor.getValue());
	});

	it('calls onready with the diff editor and monaco namespace', async () => {
		const onready = vi.fn();
		const { host } = renderHost({ original: '', modified: '', onready });
		const editor = await waitForEditor(host);

		expect(onready).toHaveBeenCalledTimes(1);
		expect(onready.mock.calls[0][0]).toBe(editor);
		expect(onready.mock.calls[0][1]).toHaveProperty('editor');
	});

	it('supports multiple diff editors on one page (unique model URIs)', async () => {
		const a = renderHost({ original: 'a-orig', modified: 'a-mod' });
		const b = renderHost({ original: 'b-orig', modified: 'b-mod' });
		const editorA = await waitForEditor(a.host);
		const editorB = await waitForEditor(b.host);

		expect(editorA.getModel()?.original.getValue()).toBe('a-orig');
		expect(editorA.getModel()?.modified.getValue()).toBe('a-mod');
		expect(editorB.getModel()?.original.getValue()).toBe('b-orig');
		expect(editorB.getModel()?.modified.getValue()).toBe('b-mod');
	});

	it('cleans up the editor on unmount', async () => {
		const { screen, host } = renderHost({ original: 'bye', modified: 'bye' });
		await waitForEditor(host);

		screen.unmount();

		expect(document.querySelector('.monaco-diff-editor')).toBeNull();
	});
});
