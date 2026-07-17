import { vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { MonacoCodeEditor } from '../../../lib/types.js';
import MarkdownHost from './MarkdownHost.svelte';

export interface MarkdownHostApi {
	getValue(): string;
	setValue(next: string): void;
	getEditor(): MonacoCodeEditor | undefined;
}

/** Renders the host fixture; `component` is cast to its exported functions. */
export function renderHost(props: Record<string, unknown> = {}) {
	const screen = render(MarkdownHost, props);
	return { screen, host: screen.component as unknown as MarkdownHostApi };
}

export async function waitForEditor(host: MarkdownHostApi): Promise<MonacoCodeEditor> {
	return await vi.waitFor(
		() => {
			const editor = host.getEditor();
			if (!editor) throw new Error('editor not ready yet');
			return editor;
		},
		{ timeout: 25_000, interval: 100 }
	);
}
