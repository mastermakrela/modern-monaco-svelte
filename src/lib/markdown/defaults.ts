import type { EditorOptions } from '../types.js';

/**
 * Prose-friendly editor defaults used by `<MarkdownEditor>` and
 * `renderMarkdownEditor()` — no minimap/line numbers/folding, word wrap on,
 * slim scrollbar, calm unicode highlighting.
 */
export const markdownEditorDefaults: EditorOptions = {
	minimap: { enabled: false },
	wordWrap: 'on',
	lineNumbers: 'off',
	scrollBeyondLastLine: false,
	renderLineHighlight: 'none',
	overviewRulerLanes: 0,
	hideCursorInOverviewRuler: true,
	overviewRulerBorder: false,
	folding: false,
	padding: { top: 12, bottom: 12 },
	scrollbar: {
		vertical: 'auto',
		horizontal: 'hidden',
		verticalScrollbarSize: 8
	},
	unicodeHighlight: {
		nonBasicASCII: false,
		ambiguousCharacters: false,
		invisibleCharacters: false
	}
};
