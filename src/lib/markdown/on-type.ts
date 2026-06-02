import type { IDisposable, Monaco, MonacoCodeEditor } from '../types.js';
import { matchListContinuation } from './patterns.js';

/**
 * Auto-continues `- `, `* `, and `1. ` lists on Enter (when the caret is at
 * the end of the line). Pressing Enter on an empty list item removes it.
 */
export function setupMarkdownOnType(editor: MonacoCodeEditor, monaco: Monaco): IDisposable {
	return editor.onKeyDown((e) => {
		if (e.keyCode !== monaco.KeyCode.Enter) return;

		const model = editor.getModel();
		if (!model) return;

		const position = editor.getPosition();
		if (!position) return;

		const lineContent = model.getLineContent(position.lineNumber);
		// Keep native Enter behavior when the caret is in the middle of a list item.
		if (position.column !== lineContent.length + 1) return;

		const continuation = matchListContinuation(lineContent);
		if (!continuation) return;

		e.preventDefault();
		e.stopPropagation();

		editor.pushUndoStop();

		if (continuation.kind === 'remove-empty') {
			editor.executeEdits('markdown-list', [
				{
					range: {
						startLineNumber: position.lineNumber,
						startColumn: 1,
						endLineNumber: position.lineNumber,
						endColumn: lineContent.length + 1
					},
					text: '',
					forceMoveMarkers: true
				}
			]);
		} else {
			editor.executeEdits('markdown-list', [
				{
					range: {
						startLineNumber: position.lineNumber,
						startColumn: lineContent.length + 1,
						endLineNumber: position.lineNumber,
						endColumn: lineContent.length + 1
					},
					text: `\n${continuation.prefix}`,
					forceMoveMarkers: true
				}
			]);
			editor.setPosition({
				lineNumber: position.lineNumber + 1,
				column: continuation.prefix.length + 1
			});
		}

		editor.pushUndoStop();
	});
}
