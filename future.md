# Future / deferred from v1

Items deliberately out of scope for the first version.

## TODO

- [x] **`lazy()` / SSR mode component** — done in 0.1.0: `LazyMonacoEditor` + `modern-monaco-svelte/ssr` (`renderEditor` / `renderMarkdownEditor`) + `ensureLazyEditor()`.
- [ ] **Lazy-mode editor handle** — upstream's `<monaco-editor>` element keeps the created editor instance private (no property, no event), so `LazyMonacoEditor` cannot offer `bind:value`, theme switching, or `onready`. If upstream exposes the instance (or an event), add them.
- [x] **`Workspace` / multi-file support** — done in 0.2.0: `workspace`/`file`/`followHistory` props on `MonacoEditor`/`MarkdownEditor` (reactive model switching with view-state restore), `WorkspaceState` reactive helper, `listWorkspaceFiles`, `workspacePath`.
- [ ] **Workspace write helpers** — `WorkspaceState` is read/navigation-focused; conveniences like `create`/`rename`/`delete` with conflict handling (and updating open editors when the current file is renamed/deleted) are still open.
- [x] **Theme pair convenience** — done in 0.3.0: `themeLight`/`themeDark` props with live `prefers-color-scheme` detection as the default on all three editors (explicit `theme` still wins).
- [x] **Pluggable color-scheme source** — `dark` prop on `MonacoEditor`/`MarkdownEditor` lets apps drive the light/dark choice from their own state (mode-watcher, user toggle) instead of `prefers-color-scheme`; `prefers-color-scheme` stays the default when `dark` is `undefined`.
- [x] **Non-destructive external value push** — external `value` changes apply via an undoable full-range edit (bracketed by undo stops) with view-state restore, instead of `setValue()`, so the undo stack and cursor survive a mid-edit rewrite (e.g. SvelteKit single-flight query refresh).
- [ ] **SSR color-scheme hint** — `renderEditor()`/`renderMarkdownEditor()` bake one theme server-side; respecting the client preference there would need the `Sec-CH-Prefers-Color-Scheme` client hint (or a cookie) plus a recipe. Lazy mode also cannot re-theme after hydration (see lazy-mode editor handle above).
- [ ] **On-demand theme loading** — modern-monaco's patched `monaco.editor.setTheme()` only knows themes registered at `init()` time (`initShikiMonacoTokenizer` warns "Theme not found" otherwise). The internal highlighter has `loadThemeFromCDN()` but it isn't exposed publicly. If upstream exposes it, lift the "declare all themes upfront" restriction.
- [ ] **Completion suggest-widget browser test** — completion _logic_ is unit-tested; driving Monaco's suggest widget end-to-end in the browser suite was skipped as flaky. Revisit with a stable approach.
- [ ] **`modern-monaco/core` variant** — optional slimmer entry that skips built-in LSP/grammars for bundle-size-sensitive consumers.
