export { default as MonacoEditor } from './MonacoEditor.svelte';
export { default as MonacoDiffEditor } from './MonacoDiffEditor.svelte';
export { default as MarkdownEditor } from './MarkdownEditor.svelte';
export { default as LazyMonacoEditor } from './LazyMonacoEditor.svelte';

export { attachWorkspace, ensureLazyEditor, mergeInitOptions, preloadMonaco } from './monaco.js';
export {
	DEFAULT_DARK_THEME,
	DEFAULT_LIGHT_THEME,
	resolveTheme,
	systemPrefersDark
} from './theme.svelte.js';
export { listWorkspaceFiles, WorkspaceState } from './workspace.svelte.js';
export { lazyOptionsScript, serializeLazyOptions } from './lazy-options.js';
export type { LazyInput, LazyRenderOptions } from './lazy-options.js';

export { prefixLine, registerMarkdownActions, wrapSelection } from './markdown/actions.js';
export { acquireMarkdownCompletions, registerMarkdownCompletions } from './markdown/completions.js';
export { createMarkdownDecorations } from './markdown/decorations.js';
export { markdownEditorDefaults } from './markdown/defaults.js';
export { setupMarkdownOnType } from './markdown/on-type.js';
export {
	computeInlineDecorations,
	EMPHASIS_CLASS,
	markdownSnippetSuggestions,
	matchListContinuation,
	STRONG_CLASS
} from './markdown/patterns.js';
export type {
	InlineDecorationSpec,
	ListContinuation,
	SnippetSuggestionSpec
} from './markdown/patterns.js';

export type {
	DiffEditorOptions,
	EditorOptions,
	IDisposable,
	InitOptions,
	Monaco,
	MonacoCodeEditor,
	MonacoDiffEditorInstance
} from './types.js';
