import { describe, expect, it } from 'vitest';
import { resolveServerColorScheme } from '../../lib/ssr.js';

function request(headers: Record<string, string> = {}): Request {
	return new Request('http://localhost/', { headers });
}

describe('resolveServerColorScheme', () => {
	it('reads the Sec-CH-Prefers-Color-Scheme client hint', () => {
		expect(resolveServerColorScheme(request({ 'sec-ch-prefers-color-scheme': 'light' }))).toBe(
			'light'
		);
		expect(resolveServerColorScheme(request({ 'sec-ch-prefers-color-scheme': 'dark' }))).toBe(
			'dark'
		);
	});

	it('reads the hint as a quoted Structured-Field string (the real browser wire format)', () => {
		expect(resolveServerColorScheme(request({ 'sec-ch-prefers-color-scheme': '"light"' }))).toBe(
			'light'
		);
		expect(resolveServerColorScheme(request({ 'sec-ch-prefers-color-scheme': '"dark"' }))).toBe(
			'dark'
		);
	});

	it('falls back to the color-scheme cookie when the hint is absent', () => {
		expect(resolveServerColorScheme(request({ cookie: 'color-scheme=light' }))).toBe('light');
		expect(
			resolveServerColorScheme(request({ cookie: 'foo=bar; color-scheme=dark; baz=qux' }))
		).toBe('dark');
	});

	it('prefers the client hint over the cookie when both are present', () => {
		expect(
			resolveServerColorScheme(
				request({ 'sec-ch-prefers-color-scheme': 'dark', cookie: 'color-scheme=light' })
			)
		).toBe('dark');
	});

	it('returns undefined when neither the hint nor the cookie is present', () => {
		expect(resolveServerColorScheme(request())).toBeUndefined();
	});

	it('ignores an unrecognized hint or cookie value', () => {
		expect(resolveServerColorScheme(request({ 'sec-ch-prefers-color-scheme': 'sepia' }))).toBe(
			undefined
		);
		expect(resolveServerColorScheme(request({ cookie: 'color-scheme=sepia' }))).toBeUndefined();
	});
});
