import { describe, expect, it } from 'vitest';
import { lazyOptionsScript, serializeLazyOptions } from '../../lib/lazy-options.js';

/** Reverses the embedding escapes so we can assert on the JSON payload. */
function parsePayload(json: string): [unknown, Record<string, unknown>] {
	return JSON.parse(json) as [unknown, Record<string, unknown>];
}

describe('serializeLazyOptions', () => {
	it('round-trips plain code input', () => {
		const json = serializeLazyOptions('console.log(1)', { language: 'javascript' });
		expect(parsePayload(json)).toEqual(['console.log(1)', { language: 'javascript' }]);
	});

	it('round-trips file input', () => {
		const json = serializeLazyOptions({ filename: 'note.md', code: '# hi' }, {});
		expect(parsePayload(json)).toEqual([{ filename: 'note.md', code: '# hi' }, {}]);
	});

	it('escapes </script> so code cannot break out of the tag', () => {
		const code = 'const html = "</script><script>alert(1)</script>";';
		const json = serializeLazyOptions(code, {});
		expect(json).not.toContain('</script>');
		expect(json).not.toContain('<');
		expect(parsePayload(json)[0]).toBe(code);
	});

	it('escapes line/paragraph separators', () => {
		const code = 'a\u2028b\u2029c';
		const json = serializeLazyOptions(code, {});
		expect(json).not.toContain('\u2028');
		expect(json).not.toContain('\u2029');
		expect(parsePayload(json)[0]).toBe(code);
	});
});

describe('lazyOptionsScript', () => {
	it('wraps the payload in the options script tag the element expects', () => {
		const script = lazyOptionsScript('# hi', { language: 'markdown', theme: 'vitesse-dark' });
		expect(
			script.startsWith('<script type="application/json" class="monaco-editor-options">')
		).toBe(true);
		expect(script.endsWith('</script>')).toBe(true);

		const inner = script.slice(script.indexOf('>') + 1, script.lastIndexOf('<'));
		expect(parsePayload(inner)).toEqual(['# hi', { language: 'markdown', theme: 'vitesse-dark' }]);
	});
});
