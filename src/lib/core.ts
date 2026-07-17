/**
 * Bring-your-own registration for the slim `modern-monaco/core` entry point —
 * import from `modern-monaco-svelte/core` alongside {@link preloadMonacoCore}
 * and {@link ensureLazyEditorCore}.
 *
 * `core` ships no bundled grammars, themes, or LSP: call `registerSyntax()` /
 * `registerTheme()` / `registerLSPProvider()` before the first
 * `preloadMonacoCore()` / `ensureLazyEditorCore()` call (i.e. before the
 * first editor mounts) — `init()`/`lazy()` resolve languages, themes, and
 * LSP providers as soon as they run, so anything registered afterwards is
 * invisible to editors already requesting them.
 */
export { registerLSPProvider, registerSyntax, registerTheme } from 'modern-monaco/core';
export { ensureLazyEditorCore, preloadMonacoCore } from './monaco.js';
