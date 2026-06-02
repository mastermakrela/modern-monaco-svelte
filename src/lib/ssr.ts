/**
 * Server-side rendering helpers — import from `modern-monaco-svelte/ssr`
 * (server-only; do not import in client code).
 *
 * Use in a `load` function and pass the resulting HTML to
 * `<LazyMonacoEditor html={...}>` for a zero-flash pre-highlighted editor.
 */
import type { RenderInput, RenderOptions } from 'modern-monaco/ssr';
import { renderToString, renderToWebComponent } from 'modern-monaco/ssr';
import { markdownEditorDefaults } from './markdown/defaults.js';

export type { RenderInput, RenderOptions };
export { renderToString, renderToWebComponent };

/**
 * Renders code to `<monaco-editor>` web-component HTML with a Shiki
 * pre-render, ready for client hydration via `<LazyMonacoEditor html={...}>`.
 *
 * Pass the request's `user-agent` header as `options.userAgent` for accurate
 * font metrics.
 */
export function renderEditor(input: RenderInput, options: RenderOptions = {}): Promise<string> {
	return renderToWebComponent(input, options);
}

/**
 * Like {@link renderEditor}, preconfigured with the markdown language and
 * `<MarkdownEditor>`'s prose-friendly defaults.
 */
export function renderMarkdownEditor(
	input: RenderInput,
	options: RenderOptions = {}
): Promise<string> {
	return renderToWebComponent(input, {
		language: 'markdown',
		...markdownEditorDefaults,
		...options
	});
}
