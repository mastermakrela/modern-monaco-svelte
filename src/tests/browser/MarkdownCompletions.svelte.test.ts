import { userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { renderHost, waitForEditor } from './fixtures/markdown-host.js';

/** Focuses the editor via a real click on the visible text layer (the hidden
 * textarea Monaco reads keystrokes from is covered by overlaying spans and
 * never receives a direct click). */
async function focusEditor() {
	const viewLines = document.querySelector<HTMLElement>('.monaco-editor .view-lines');
	if (!viewLines) throw new Error('view-lines not found');
	await userEvent.click(viewLines);
}

/** Polls for the suggest widget's rows — it appears asynchronously after the
 * completion provider resolves, so a fixed sleep would be either flaky or slow. */
async function waitForSuggestRows(): Promise<HTMLElement[]> {
	return await vi.waitFor(
		() => {
			const rows = Array.from(
				document.querySelectorAll<HTMLElement>('.suggest-widget .monaco-list-row')
			);
			const visible = rows.filter((row) => row.getBoundingClientRect().height > 0);
			if (visible.length === 0) throw new Error('suggest widget not visible yet');
			return visible;
		},
		{ timeout: 10_000, interval: 50 }
	);
}

describe('markdown completions', () => {
	it('suggests and inserts a heading snippet on # via Enter', async () => {
		const { host } = renderHost({ initial: '' });
		const editor = await waitForEditor(host);

		await focusEditor();
		await userEvent.keyboard('#');

		await waitForSuggestRows();
		await userEvent.keyboard('{Enter}');

		await vi.waitFor(() => {
			expect(editor.getValue()).toBe('# heading');
		});
	});

	it('inserts the clicked heading level', async () => {
		const { host } = renderHost({ initial: '' });
		const editor = await waitForEditor(host);

		await focusEditor();
		await userEvent.keyboard('###');

		const rows = await waitForSuggestRows();
		const level3 = rows.find((row) => row.textContent?.includes('Heading 3'));
		if (!level3) throw new Error('level 3 heading suggestion not found');
		await userEvent.click(level3);

		await vi.waitFor(() => {
			expect(editor.getValue()).toBe('### heading');
		});
	});
});
