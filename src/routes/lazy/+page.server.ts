import { renderMarkdownEditor, resolveServerColorScheme } from '$lib/ssr.js';
import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME } from '$lib/theme.svelte.js';
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
	// undefined (no client hint or cookie yet) defaults to dark, matching
	// modern-monaco's own SSR fallback.
	const theme =
		resolveServerColorScheme(request) === 'light' ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME;

	return {
		editorHtml: await renderMarkdownEditor(code, {
			theme,
			userAgent: request.headers.get('user-agent') ?? undefined
		})
	};
};
