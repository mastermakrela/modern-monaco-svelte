import type { Handle } from '@sveltejs/kit';

/**
 * The `Sec-CH-Prefers-Color-Scheme` client hint is opt-in: the browser only
 * sends it once the server has advertised it via `Accept-CH` on a prior
 * response. `Critical-CH` additionally forces a resend-with-hint round trip,
 * so even the very first navigation in a session ends up with the header —
 * see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-CH-Prefers-Color-Scheme}.
 *
 * Pair with `resolveServerColorScheme` (from `modern-monaco-svelte/ssr`) to
 * pick a real theme server-side instead of guessing one.
 */
const CLIENT_HINTS = 'Sec-CH-Prefers-Color-Scheme';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('Accept-CH', CLIENT_HINTS);
	response.headers.set('Critical-CH', CLIENT_HINTS);
	return response;
};
