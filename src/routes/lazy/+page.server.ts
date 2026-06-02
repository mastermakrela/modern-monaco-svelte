import { renderMarkdownEditor } from '$lib/ssr.js';
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
	return {
		editorHtml: await renderMarkdownEditor(code, {
			theme: 'vitesse-dark',
			userAgent: request.headers.get('user-agent') ?? undefined
		})
	};
};
