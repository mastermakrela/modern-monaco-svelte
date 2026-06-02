import type { IDisposable, Monaco, MonacoCodeEditor } from '../types.js';
import { computeInlineDecorations } from './patterns.js';

/**
 * Applies live `**bold**` / `*italic*` inline decorations to the editor
 * (CSS classes `markdown-strong` / `markdown-emphasis` — style them yourself
 * or use `<MarkdownEditor>`, which ships default styles).
 */
export function createMarkdownDecorations(editor: MonacoCodeEditor, monaco: Monaco): IDisposable {
	const collection = editor.createDecorationsCollection();

	function update() {
		const model = editor.getModel();
		if (!model) return;

		const decorations = [];
		for (let lineNumber = 1; lineNumber <= model.getLineCount(); lineNumber += 1) {
			for (const spec of computeInlineDecorations(model.getLineContent(lineNumber), lineNumber)) {
				decorations.push({
					range: new monaco.Range(
						spec.lineNumber,
						spec.startColumn,
						spec.lineNumber,
						spec.endColumn
					),
					options: { inlineClassName: spec.className }
				});
			}
		}
		collection.set(decorations);
	}

	update();
	const subscription = editor.onDidChangeModelContent(update);

	return {
		dispose() {
			subscription.dispose();
			collection.clear();
		}
	};
}
