import type { IDisposable, Monaco, MonacoCodeEditor } from '../types.js';

/**
 * Toggle-wraps the current selection with `before`/`after` markers.
 * If already wrapped (inside the selection or directly around it), unwraps.
 * If nothing is selected, inserts the markers and places the cursor between.
 */
export function wrapSelection(editor: MonacoCodeEditor, before: string, after: string): void {
	const model = editor.getModel();
	if (!model) return;

	const selection = editor.getSelection();
	if (!selection) return;

	const selectedText = model.getValueInRange(selection);

	editor.pushUndoStop();

	if (selectedText.length > 0) {
		if (selectedText.startsWith(before) && selectedText.endsWith(after)) {
			// Unwrap: remove markers from inside the selection
			const unwrapped = selectedText.slice(before.length, selectedText.length - after.length);
			editor.executeEdits('markdown-helper', [
				{ range: selection, text: unwrapped, forceMoveMarkers: true }
			]);
			const startPos = selection.getStartPosition();
			editor.setSelection({
				startLineNumber: startPos.lineNumber,
				startColumn: startPos.column,
				endLineNumber: startPos.lineNumber,
				endColumn: startPos.column + unwrapped.length
			});
		} else {
			// Check whether the text surrounding the selection already has the markers
			const startPos = selection.getStartPosition();
			const endPos = selection.getEndPosition();

			const beforeRange = {
				startLineNumber: startPos.lineNumber,
				startColumn: Math.max(1, startPos.column - before.length),
				endLineNumber: startPos.lineNumber,
				endColumn: startPos.column
			};
			const afterRange = {
				startLineNumber: endPos.lineNumber,
				startColumn: endPos.column,
				endLineNumber: endPos.lineNumber,
				endColumn: endPos.column + after.length
			};

			const textBefore = model.getValueInRange(beforeRange);
			const textAfter = model.getValueInRange(afterRange);

			if (textBefore === before && textAfter === after) {
				// Unwrap by removing the surrounding markers
				editor.executeEdits('markdown-helper', [
					{
						range: {
							startLineNumber: beforeRange.startLineNumber,
							startColumn: beforeRange.startColumn,
							endLineNumber: afterRange.endLineNumber,
							endColumn: afterRange.endColumn
						},
						text: selectedText,
						forceMoveMarkers: true
					}
				]);
				editor.setSelection({
					startLineNumber: beforeRange.startLineNumber,
					startColumn: beforeRange.startColumn,
					endLineNumber: beforeRange.startLineNumber,
					endColumn: beforeRange.startColumn + selectedText.length
				});
			} else {
				// Wrap the selection
				editor.executeEdits('markdown-helper', [
					{ range: selection, text: before + selectedText + after, forceMoveMarkers: true }
				]);
				// Select just the text between the markers
				editor.setSelection({
					startLineNumber: startPos.lineNumber,
					startColumn: startPos.column + before.length,
					endLineNumber: endPos.lineNumber,
					endColumn: endPos.column + before.length
				});
			}
		}
	} else {
		// No selection: insert markers and place the cursor between them
		const position = editor.getPosition();
		if (!position) return;

		editor.executeEdits('markdown-helper', [
			{
				range: {
					startLineNumber: position.lineNumber,
					startColumn: position.column,
					endLineNumber: position.lineNumber,
					endColumn: position.column
				},
				text: before + after,
				forceMoveMarkers: true
			}
		]);
		editor.setPosition({
			lineNumber: position.lineNumber,
			column: position.column + before.length
		});
	}

	editor.pushUndoStop();
}

/**
 * Toggle-prefixes the current line with `prefix` (e.g. `# ` or `> `).
 */
export function prefixLine(editor: MonacoCodeEditor, prefix: string): void {
	const model = editor.getModel();
	if (!model) return;

	const position = editor.getPosition();
	if (!position) return;

	const lineNumber = position.lineNumber;
	const lineContent = model.getLineContent(lineNumber);

	editor.pushUndoStop();

	if (lineContent.startsWith(prefix)) {
		editor.executeEdits('markdown-helper', [
			{
				range: {
					startLineNumber: lineNumber,
					startColumn: 1,
					endLineNumber: lineNumber,
					endColumn: 1 + prefix.length
				},
				text: '',
				forceMoveMarkers: true
			}
		]);
	} else {
		editor.executeEdits('markdown-helper', [
			{
				range: {
					startLineNumber: lineNumber,
					startColumn: 1,
					endLineNumber: lineNumber,
					endColumn: 1
				},
				text: prefix,
				forceMoveMarkers: true
			}
		]);
	}

	editor.pushUndoStop();
}

/**
 * Registers markdown formatting keyboard shortcuts on the editor:
 * Cmd/Ctrl+B bold, Cmd/Ctrl+I italic, Cmd/Ctrl+Shift+X strikethrough,
 * Cmd/Ctrl+E inline code, Cmd/Ctrl+K link.
 */
export function registerMarkdownActions(editor: MonacoCodeEditor, monaco: Monaco): IDisposable {
	const disposables: IDisposable[] = [];
	const { KeyMod, KeyCode } = monaco;

	disposables.push(
		editor.addAction({
			id: 'markdown-bold',
			label: 'Markdown: Bold',
			keybindings: [KeyMod.CtrlCmd | KeyCode.KeyB],
			run: (ed) => wrapSelection(ed as MonacoCodeEditor, '**', '**')
		}),
		editor.addAction({
			id: 'markdown-italic',
			label: 'Markdown: Italic',
			keybindings: [KeyMod.CtrlCmd | KeyCode.KeyI],
			run: (ed) => wrapSelection(ed as MonacoCodeEditor, '*', '*')
		}),
		editor.addAction({
			id: 'markdown-strikethrough',
			label: 'Markdown: Strikethrough',
			keybindings: [KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyX],
			run: (ed) => wrapSelection(ed as MonacoCodeEditor, '~~', '~~')
		}),
		editor.addAction({
			id: 'markdown-inline-code',
			label: 'Markdown: Inline Code',
			keybindings: [KeyMod.CtrlCmd | KeyCode.KeyE],
			run: (ed) => wrapSelection(ed as MonacoCodeEditor, '`', '`')
		}),
		editor.addAction({
			id: 'markdown-link',
			label: 'Markdown: Insert Link',
			keybindings: [KeyMod.CtrlCmd | KeyCode.KeyK],
			run: (untyped) => {
				const ed = untyped as MonacoCodeEditor;
				const model = ed.getModel();
				if (!model) return;
				const selection = ed.getSelection();
				if (!selection) return;
				const selectedText = model.getValueInRange(selection);
				if (selectedText.length > 0) {
					// Wrap selected text as the link text, select "url" for easy replacement
					ed.pushUndoStop();
					const startPos = selection.getStartPosition();
					ed.executeEdits('markdown-helper', [
						{ range: selection, text: `[${selectedText}](url)`, forceMoveMarkers: true }
					]);
					// skip `[` + text + `](` to land on "url"
					const urlStart = startPos.column + selectedText.length + 3;
					ed.setSelection({
						startLineNumber: startPos.lineNumber,
						startColumn: urlStart,
						endLineNumber: startPos.lineNumber,
						endColumn: urlStart + 3
					});
					ed.pushUndoStop();
				} else {
					wrapSelection(ed, '[', '](url)');
				}
			}
		})
	);

	return {
		dispose() {
			disposables.forEach((d) => d.dispose());
		}
	};
}
