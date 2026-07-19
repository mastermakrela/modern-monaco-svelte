import { allNavLinks, SITE_URL } from '$lib/nav.js';

// Generated at build time (adapter-static) from the same nav list the
// sidebar renders, so it can't drift from the actual pages.
export const prerender = true;

export function GET(): Response {
	const urls = allNavLinks
		.map((link) => `\t<url>\n\t\t<loc>${SITE_URL}${link.href}</loc>\n\t</url>`)
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml' }
	});
}
