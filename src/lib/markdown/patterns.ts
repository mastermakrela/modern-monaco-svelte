/**
 * Pure markdown pattern logic — no monaco dependency, unit-testable.
 * Columns are 1-based, matching monaco's coordinate system.
 */

export interface InlineDecorationSpec {
	lineNumber: number;
	startColumn: number;
	endColumn: number;
	className: string;
}

/** CSS class applied to `**bold**` inner text. */
export const STRONG_CLASS = 'markdown-strong';
/** CSS class applied to `*italic*` / `_italic_` inner text. */
export const EMPHASIS_CLASS = 'markdown-emphasis';

/**
 * Computes inline bold/italic decorations for a single line.
 * Decorates the text between the markers (markers excluded).
 */
export function computeInlineDecorations(line: string, lineNumber: number): InlineDecorationSpec[] {
	const decorations: InlineDecorationSpec[] = [];

	for (const match of line.matchAll(/\*\*([^*\n]+?)\*\*/g)) {
		const startColumn = (match.index ?? 0) + 3;
		decorations.push({
			lineNumber,
			startColumn,
			endColumn: startColumn + match[1].length,
			className: STRONG_CLASS
		});
	}

	for (const match of line.matchAll(/(^|[^\w*])\*([^*\n]+?)\*(?!\*)/g)) {
		const prefixLength = match[1]?.length ?? 0;
		const startColumn = (match.index ?? 0) + prefixLength + 2;
		decorations.push({
			lineNumber,
			startColumn,
			endColumn: startColumn + match[2].length,
			className: EMPHASIS_CLASS
		});
	}

	for (const match of line.matchAll(/(^|[^\w])_([^_\n]+?)_(?!_)/g)) {
		const prefixLength = match[1]?.length ?? 0;
		const startColumn = (match.index ?? 0) + prefixLength + 2;
		decorations.push({
			lineNumber,
			startColumn,
			endColumn: startColumn + match[2].length,
			className: EMPHASIS_CLASS
		});
	}

	return decorations;
}

export type ListContinuation =
	/** Line is an empty list item — remove it on Enter. */
	| { kind: 'remove-empty' }
	/** Line is a non-empty list item — continue with `prefix` on the next line. */
	| { kind: 'continue'; prefix: string };

const LIST_PATTERNS: Array<{
	regex: RegExp;
	empty: boolean;
	next: (m: RegExpMatchArray) => string;
}> = [
	{ regex: /^(\s*)([-*])\s$/, empty: true, next: (m) => `${m[1]}${m[2]} ` },
	{ regex: /^(\s*)([-*])\s(.+)$/, empty: false, next: (m) => `${m[1]}${m[2]} ` },
	{ regex: /^(\s*)(\d+)\.\s$/, empty: true, next: (m) => `${m[1]}${parseInt(m[2]) + 1}. ` },
	{ regex: /^(\s*)(\d+)\.\s(.+)$/, empty: false, next: (m) => `${m[1]}${parseInt(m[2]) + 1}. ` }
];

/**
 * Decides how Enter should behave at the end of `line`:
 * continue the list, remove an empty item, or `null` for native behavior.
 */
export function matchListContinuation(line: string): ListContinuation | null {
	for (const pattern of LIST_PATTERNS) {
		const match = line.match(pattern.regex);
		if (!match) continue;
		if (pattern.empty) return { kind: 'remove-empty' };
		return { kind: 'continue', prefix: pattern.next(match) };
	}
	return null;
}

export interface SnippetSuggestionSpec {
	label: string;
	/** Snippet-syntax text (`${1:placeholder}`). */
	insertText: string;
	documentation: string;
	/**
	 * Where the replace range starts: `'line-start'` or a number of
	 * characters before the cursor.
	 */
	replaceFrom: 'line-start' | number;
}

/**
 * Computes snippet suggestions for the text before the cursor.
 * Triggers: `#` (headings), ``` (code block), `[` (link), `![` (image).
 */
export function markdownSnippetSuggestions(textUntilPosition: string): SnippetSuggestionSpec[] {
	const suggestions: SnippetSuggestionSpec[] = [];

	if (/^#{1,6}\s*$/.test(textUntilPosition)) {
		for (let level = 1; level <= 6; level++) {
			const hashes = '#'.repeat(level);
			suggestions.push({
				label: `${hashes} Heading ${level}`,
				insertText: `${hashes} \${1:heading}`,
				documentation: `Insert heading level ${level}`,
				replaceFrom: 'line-start'
			});
		}
	}

	if (textUntilPosition.endsWith('```')) {
		suggestions.push({
			label: '``` Code Block',
			insertText: '```${1:language}\n${2:code}\n```',
			documentation: 'Insert fenced code block',
			replaceFrom: 3
		});
	}

	if (textUntilPosition.endsWith('[')) {
		suggestions.push({
			label: '[] Link',
			insertText: '[${1:text}](${2:url})',
			documentation: 'Insert markdown link',
			replaceFrom: 1
		});
	}

	if (textUntilPosition.endsWith('![')) {
		suggestions.push({
			label: '![] Image',
			insertText: '![${1:alt text}](${2:url})',
			documentation: 'Insert markdown image',
			replaceFrom: 2
		});
	}

	return suggestions;
}
