import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME } from 'modern-monaco-svelte';
import { renderMarkdownEditor, resolveServerColorScheme } from 'modern-monaco-svelte/ssr';
import type { PageServerLoad } from './$types.js';

const code = [
	'# Server-rendered editor',
	'',
	'This editor was **pre-rendered on the server** with Shiki —',
	'the highlighted code is visible before any editor JavaScript loads.',
	'',
	'- zero flash of unstyled content',
	'- the live Monaco editor hydrates in the background',
	''
].join('\n');

export const load: PageServerLoad = async ({ request }) => {
	// This demo is fully prerendered (adapter-static), so this `load` runs
	// once at *build* time — there is no real incoming request. That means
	// `resolveServerColorScheme` never finds a `Sec-CH-Prefers-Color-Scheme`
	// hint or a `color-scheme` cookie here, and always falls back to dark
	// (modern-monaco's own SSR default). The call is kept anyway: in a real
	// SSR deployment (not statically adapted) it would pick up the visitor's
	// actual preference per request.
	const theme =
		resolveServerColorScheme(request) === 'light' ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME;

	// At prerender time there's no user-agent header either, and modern-monaco's
	// SSR renderer requires `userAgent` or `fontFamily` outside the browser (it
	// measures text to size the editor). Fall back to a fixed mono stack.
	const userAgent = request.headers.get('user-agent');

	return {
		editorHtml: await renderMarkdownEditor(code, {
			theme,
			...(userAgent ? { userAgent } : { fontFamily: 'ui-monospace, Menlo, monospace' })
		})
	};
};
