import type { EditorOptions } from './types.js';

/** Code input for the `<monaco-editor>` element: plain code or a named file. */
export type LazyInput = string | { filename: string; code: string };

/** Editor options understood by the `<monaco-editor>` element's options script. */
export type LazyRenderOptions = EditorOptions & { theme?: string };

/**
 * Serializes `[input, options]` to JSON that is safe to embed in an inline
 * `<script>` tag: `/` and `<` are escaped so code containing `</script>` or
 * HTML cannot break out of the tag (matches modern-monaco's own SSR escaping).
 */
export function serializeLazyOptions(input: LazyInput, options: LazyRenderOptions): string {
	return JSON.stringify([input, options])
		.replaceAll('/', '\\/')
		.replaceAll('<', '\\u003c')
		.replaceAll('\u2028', '\\u2028')
		.replaceAll('\u2029', '\\u2029');
}

/**
 * Builds the inline options script consumed by the `<monaco-editor>` element
 * (it must be the element's first child).
 */
export function lazyOptionsScript(input: LazyInput, options: LazyRenderOptions): string {
	return (
		'<script type="application/json" class="monaco-editor-options">' +
		serializeLazyOptions(input, options) +
		'<' +
		'/script>'
	);
}
