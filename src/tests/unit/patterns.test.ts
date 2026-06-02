import { describe, expect, it } from 'vitest';
import {
	computeInlineDecorations,
	EMPHASIS_CLASS,
	markdownSnippetSuggestions,
	matchListContinuation,
	STRONG_CLASS
} from '../../lib/markdown/patterns.js';

describe('computeInlineDecorations', () => {
	it('decorates bold inner text (markers excluded)', () => {
		expect(computeInlineDecorations('**bold**', 1)).toEqual([
			{ lineNumber: 1, startColumn: 3, endColumn: 7, className: STRONG_CLASS }
		]);
	});

	it('decorates asterisk italics', () => {
		expect(computeInlineDecorations('*it*', 2)).toEqual([
			{ lineNumber: 2, startColumn: 2, endColumn: 4, className: EMPHASIS_CLASS }
		]);
	});

	it('decorates italics preceded by non-word characters', () => {
		expect(computeInlineDecorations('a *it*', 1)).toEqual([
			{ lineNumber: 1, startColumn: 4, endColumn: 6, className: EMPHASIS_CLASS }
		]);
	});

	it('decorates underscore italics', () => {
		expect(computeInlineDecorations('_em_', 1)).toEqual([
			{ lineNumber: 1, startColumn: 2, endColumn: 4, className: EMPHASIS_CLASS }
		]);
	});

	it('does not treat bold markers as italics', () => {
		const decorations = computeInlineDecorations('**x**', 1);
		expect(decorations).toHaveLength(1);
		expect(decorations[0].className).toBe(STRONG_CLASS);
	});

	it('ignores asterisks inside words', () => {
		expect(computeInlineDecorations('a*b*', 1)).toEqual([]);
	});

	it('ignores underscores inside identifiers', () => {
		expect(computeInlineDecorations('snake_case_name', 1)).toEqual([]);
	});

	it('handles multiple decorations on one line', () => {
		const decorations = computeInlineDecorations('**bold** and *it*', 1);
		expect(decorations).toHaveLength(2);
		expect(decorations.map((d) => d.className)).toEqual([STRONG_CLASS, EMPHASIS_CLASS]);
	});

	it('returns nothing for plain text and empty lines', () => {
		expect(computeInlineDecorations('', 1)).toEqual([]);
		expect(computeInlineDecorations('plain text', 1)).toEqual([]);
	});
});

describe('matchListContinuation', () => {
	it('continues dash lists', () => {
		expect(matchListContinuation('- item')).toEqual({ kind: 'continue', prefix: '- ' });
	});

	it('continues star lists', () => {
		expect(matchListContinuation('* item')).toEqual({ kind: 'continue', prefix: '* ' });
	});

	it('preserves indentation', () => {
		expect(matchListContinuation('  - item')).toEqual({ kind: 'continue', prefix: '  - ' });
	});

	it('increments ordered lists', () => {
		expect(matchListContinuation('1. item')).toEqual({ kind: 'continue', prefix: '2. ' });
		expect(matchListContinuation('9. item')).toEqual({ kind: 'continue', prefix: '10. ' });
	});

	it('removes empty list items', () => {
		expect(matchListContinuation('- ')).toEqual({ kind: 'remove-empty' });
		expect(matchListContinuation('1. ')).toEqual({ kind: 'remove-empty' });
		expect(matchListContinuation('  * ')).toEqual({ kind: 'remove-empty' });
	});

	it('returns null for non-list lines', () => {
		expect(matchListContinuation('plain text')).toBeNull();
		expect(matchListContinuation('-item')).toBeNull();
		expect(matchListContinuation('1.item')).toBeNull();
		expect(matchListContinuation('')).toBeNull();
	});
});

describe('markdownSnippetSuggestions', () => {
	it('suggests all six heading levels on #', () => {
		const suggestions = markdownSnippetSuggestions('#');
		expect(suggestions).toHaveLength(6);
		expect(suggestions[0].label).toBe('# Heading 1');
		expect(suggestions[5].label).toBe('###### Heading 6');
		expect(suggestions.every((s) => s.replaceFrom === 'line-start')).toBe(true);
	});

	it('suggests headings for up to six hashes', () => {
		expect(markdownSnippetSuggestions('###')).toHaveLength(6);
		expect(markdownSnippetSuggestions('######')).toHaveLength(6);
		expect(markdownSnippetSuggestions('#######')).toHaveLength(0);
	});

	it('does not suggest headings once text follows', () => {
		expect(markdownSnippetSuggestions('# abc')).toHaveLength(0);
	});

	it('suggests a code block after triple backticks', () => {
		const suggestions = markdownSnippetSuggestions('```');
		expect(suggestions).toHaveLength(1);
		expect(suggestions[0].label).toBe('``` Code Block');
		expect(suggestions[0].replaceFrom).toBe(3);
	});

	it('suggests a link after [', () => {
		const suggestions = markdownSnippetSuggestions('see [');
		expect(suggestions).toHaveLength(1);
		expect(suggestions[0].label).toBe('[] Link');
		expect(suggestions[0].replaceFrom).toBe(1);
	});

	it('suggests both link and image after ![', () => {
		// `![` ends with `[` too, so both suggestions fire (matches upstream behavior)
		const labels = markdownSnippetSuggestions('see ![').map((s) => s.label);
		expect(labels).toContain('[] Link');
		expect(labels).toContain('![] Image');
	});

	it('returns nothing for plain text', () => {
		expect(markdownSnippetSuggestions('hello')).toHaveLength(0);
	});
});
