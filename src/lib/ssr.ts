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

const COLOR_SCHEME_COOKIE = 'color-scheme';

/**
 * Resolves the client's real color scheme preference on the server, for
 * picking `options.theme` before pre-rendering — see the recipe on
 * {@link renderEditor}.
 *
 * Reads the `Sec-CH-Prefers-Color-Scheme` request header (only sent once the
 * `handle` hook in `src/hooks.server.ts` has advertised it via `Accept-CH` on
 * a prior response), falling back to a `color-scheme` cookie for browsers
 * and proxies that strip client hints. Returns `undefined` when neither is
 * present — e.g. the very first request in a session, before either exists.
 *
 * This only reads the cookie — nothing writes it. The client hint alone is
 * enough to respect the OS-level preference; only wire up a `color-scheme`
 * cookie writer (e.g. from a manual dark-mode toggle) if you need that
 * preference to override the client hint across reloads.
 */
export function resolveServerColorScheme(request: Request): 'light' | 'dark' | undefined {
	// Sent as a Structured-Field string, e.g. `"dark"` (quotes included).
	const hint = request.headers.get('sec-ch-prefers-color-scheme')?.replace(/^"|"$/g, '');
	if (hint === 'light' || hint === 'dark') return hint;

	const cookie = request.headers
		.get('cookie')
		?.split(';')
		.map((entry) => entry.trim())
		.find((entry) => entry.startsWith(`${COLOR_SCHEME_COOKIE}=`))
		?.slice(COLOR_SCHEME_COOKIE.length + 1);
	if (cookie === 'light' || cookie === 'dark') return cookie;

	return undefined;
}

/**
 * Renders code to `<monaco-editor>` web-component HTML with a Shiki
 * pre-render, ready for client hydration via `<LazyMonacoEditor html={...}>`.
 *
 * Pass the request's `user-agent` header as `options.userAgent` for accurate
 * font metrics.
 *
 * To render with the client's real theme instead of guessing one:
 * 1. Add the `handle` hook from `src/hooks.server.ts` (opts into the
 *    `Sec-CH-Prefers-Color-Scheme` client hint).
 * 2. Call {@link resolveServerColorScheme} with the request in your `load`.
 * 3. Pick `options.theme` from the result (falling back to a default when
 *    it's `undefined`) before calling `renderEditor`/`renderMarkdownEditor`.
 *
 * ```ts
 * import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME } from 'modern-monaco-svelte';
 *
 * const scheme = resolveServerColorScheme(request);
 * const theme = scheme === 'light' ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME;
 * const html = await renderEditor(code, { theme });
 * ```
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
