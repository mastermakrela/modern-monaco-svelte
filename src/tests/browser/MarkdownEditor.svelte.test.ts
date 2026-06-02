import { userEvent } from '@vitest/browser/context';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { MonacoCodeEditor } from '../../lib/types.js';
import MarkdownHost from './fixtures/MarkdownHost.svelte';

interface MarkdownHostApi {
	getValue(): string;
	setValue(next: string): void;
	getEditor(): MonacoCodeEditor | undefined;
}

/** Renders the host fixture; `component` is cast to its exported functions. */
function renderHost(props: Record<string, unknown> = {}) {
	const screen = render(MarkdownHost, props);
	return { screen, host: screen.component as unknown as MarkdownHostApi };
}

async function waitForEditor(host: MarkdownHostApi): Promise<MonacoCodeEditor> {
	return await vi.waitFor(
		() => {
			const editor = host.getEditor();
			if (!editor) throw new Error('editor not ready yet');
			return editor;
		},
		{ timeout: 25_000, interval: 100 }
	);
}

describe('MarkdownEditor', () => {
	it('uses the markdown language and prose-friendly defaults', async () => {
		const { host } = renderHost({ initial: '# hi' });
		const editor = await waitForEditor(host);

		expect(editor.getModel()?.getLanguageId()).toBe('markdown');

		const raw = editor.getRawOptions();
		expect(raw.lineNumbers).toBe('off');
		expect(raw.minimap?.enabled).toBe(false);
		expect(raw.wordWrap).toBe('on');
		expect(raw.folding).toBe(false);
	});

	it('lets options override the defaults', async () => {
		const { host } = renderHost({ options: { lineNumbers: 'on' } });
		const editor = await waitForEditor(host);

		expect(editor.getRawOptions().lineNumbers).toBe('on');
	});

	it('toggles bold with the markdown-bold action', async () => {
		const { host } = renderHost({ initial: 'hello' });
		const editor = await waitForEditor(host);

		editor.setSelection({
			startLineNumber: 1,
			startColumn: 1,
			endLineNumber: 1,
			endColumn: 6
		});
		await editor.getAction('markdown-bold')!.run();
		expect(editor.getValue()).toBe('**hello**');

		// the action leaves the inner text selected — running again unwraps
		await editor.getAction('markdown-bold')!.run();
		expect(editor.getValue()).toBe('hello');
	});

	it('wraps the selection as a link with the url placeholder selected', async () => {
		const { host } = renderHost({ initial: 'click' });
		const editor = await waitForEditor(host);

		editor.setSelection({
			startLineNumber: 1,
			startColumn: 1,
			endLineNumber: 1,
			endColumn: 6
		});
		await editor.getAction('markdown-link')!.run();

		expect(editor.getValue()).toBe('[click](url)');
		const selection = editor.getSelection()!;
		expect(editor.getModel()!.getValueInRange(selection)).toBe('url');
	});

	it('continues lists on Enter', async () => {
		const { host } = renderHost({ initial: '- item' });
		const editor = await waitForEditor(host);

		editor.setPosition({ lineNumber: 1, column: 7 });
		editor.focus();
		await userEvent.keyboard('{Enter}');

		await vi.waitFor(() => {
			expect(editor.getValue()).toBe('- item\n- ');
		});
		expect(editor.getPosition()).toMatchObject({ lineNumber: 2, column: 3 });
	});

	it('removes empty list items on Enter', async () => {
		const { host } = renderHost({ initial: '- item\n- ' });
		const editor = await waitForEditor(host);

		editor.setPosition({ lineNumber: 2, column: 3 });
		editor.focus();
		await userEvent.keyboard('{Enter}');

		await vi.waitFor(() => {
			expect(editor.getValue()).toBe('- item\n');
		});
	});

	it('applies inline bold/italic decorations', async () => {
		const { host } = renderHost({ initial: '**bold** and *em*' });
		await waitForEditor(host);

		await vi.waitFor(() => {
			expect(document.querySelector('.markdown-strong')).not.toBeNull();
			expect(document.querySelector('.markdown-emphasis')).not.toBeNull();
		});
	});

	it('skips decorations when inlineDecorations is false', async () => {
		const { host } = renderHost({ initial: '**bold**', inlineDecorations: false });
		const editor = await waitForEditor(host);

		// give the renderer time to paint the line before asserting absence
		await vi.waitFor(() => {
			expect(document.querySelector('.view-line')).not.toBeNull();
		});
		await new Promise((resolve) => setTimeout(resolve, 300));

		expect(editor.getValue()).toBe('**bold**');
		expect(document.querySelector('.markdown-strong')).toBeNull();
	});
});
