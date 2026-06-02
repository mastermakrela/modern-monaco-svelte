import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LazyMonacoEditor from '../../lib/LazyMonacoEditor.svelte';
import { renderMarkdownEditor } from '../../lib/ssr.js';

function editorText(): string {
	// monaco renders spaces as NBSP in view lines
	return (document.querySelector('.monaco-editor .view-lines')?.textContent ?? '').replaceAll(
		'\u00a0',
		' '
	);
}

async function waitForLiveEditor(timeout = 25_000): Promise<void> {
	await vi.waitFor(
		() => {
			expect(document.querySelector('.monaco-editor')).not.toBeNull();
		},
		{ timeout, interval: 200 }
	);
}

describe('LazyMonacoEditor', () => {
	it('renders a live editor from embedded code', async () => {
		render(LazyMonacoEditor, {
			value: '# hello lazy',
			language: 'markdown',
			class: 'lazy-host'
		});

		// the custom element and its options script are rendered synchronously
		const element = document.querySelector('monaco-editor');
		expect(element).not.toBeNull();

		await waitForLiveEditor();
		await vi.waitFor(() => {
			expect(editorText()).toContain('hello lazy');
		});
	});

	it('hydrates server-rendered HTML with a zero-flash prerender', async () => {
		const html = await renderMarkdownEditor('# prerendered content', {
			userAgent: navigator.userAgent
		});
		expect(html.startsWith('<monaco-editor>')).toBe(true);

		render(LazyMonacoEditor, { html });

		// the Shiki prerender is visible immediately, before the editor loads
		const prerender = document.querySelector('.monaco-editor-prerender');
		expect(prerender).not.toBeNull();
		expect(prerender!.textContent).toContain('prerendered content');

		await waitForLiveEditor();
		await vi.waitFor(() => {
			expect(editorText()).toContain('prerendered content');
		});
	});
});
