import type { IDisposable, Monaco } from '../types.js';
import { markdownSnippetSuggestions } from './patterns.js';

/**
 * Registers a CompletionItemProvider for markdown with common snippets
 * (headings, fenced code blocks, links, images).
 *
 * Registration is global per page (monaco providers are not editor-scoped) —
 * prefer {@link acquireMarkdownCompletions} when multiple editors may mount.
 */
export function registerMarkdownCompletions(monaco: Monaco): IDisposable {
	const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;

	return monaco.languages.registerCompletionItemProvider('markdown', {
		triggerCharacters: ['#', '`', '[', '!'],
		provideCompletionItems(model, position) {
			const lineContent = model.getLineContent(position.lineNumber);
			const textUntilPosition = lineContent.substring(0, position.column - 1);

			const suggestions = markdownSnippetSuggestions(textUntilPosition).map((spec) => ({
				label: spec.label,
				kind: CompletionItemKind.Snippet,
				insertText: spec.insertText,
				insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
				documentation: spec.documentation,
				range: {
					startLineNumber: position.lineNumber,
					startColumn:
						spec.replaceFrom === 'line-start' ? 1 : Math.max(1, position.column - spec.replaceFrom),
					endLineNumber: position.lineNumber,
					endColumn: position.column
				}
			}));

			return { suggestions };
		}
	});
}

let registration: { disposable: IDisposable; count: number } | null = null;

/**
 * Reference-counted variant of {@link registerMarkdownCompletions}: the
 * provider is registered once per page and disposed when the last holder
 * disposes.
 */
export function acquireMarkdownCompletions(monaco: Monaco): IDisposable {
	if (registration) {
		registration.count++;
	} else {
		registration = { disposable: registerMarkdownCompletions(monaco), count: 1 };
	}
	let released = false;
	return {
		dispose() {
			if (released || !registration) return;
			released = true;
			registration.count--;
			if (registration.count === 0) {
				registration.disposable.dispose();
				registration = null;
			}
		}
	};
}
