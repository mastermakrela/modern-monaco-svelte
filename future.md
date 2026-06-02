# Future / deferred from v1

Items deliberately out of scope for the first version.

## TODO

- [x] **`lazy()` / SSR mode component** — done in 0.1.0: `LazyMonacoEditor` + `modern-monaco-svelte/ssr` (`renderEditor` / `renderMarkdownEditor`) + `ensureLazyEditor()`.
- [ ] **Lazy-mode editor handle** — upstream's `<monaco-editor>` element keeps the created editor instance private (no property, no event), so `LazyMonacoEditor` cannot offer `bind:value`, theme switching, or `onready`. If upstream exposes the instance (or an event), add them.
- [ ] **`Workspace` / multi-file support** — `LazyMonacoEditor` accepts a `workspace` and watches files for `onchange`, but a first-class wrapper (reactive open-file switching, history navigation, multi-editor layouts) is still open. For `init()` mode, consumers can pass `workspace` through `preloadMonaco()` options themselves.
- [ ] **Theme pair convenience** — optional `themeLight`/`themeDark` props (+ a `mode` prop or `prefers-color-scheme` detection) on `MarkdownEditor`, so consumers don't have to wire mode-watcher themselves. v1 keeps a single reactive `theme` prop to stay dependency-free.
- [ ] **On-demand theme loading** — modern-monaco's patched `monaco.editor.setTheme()` only knows themes registered at `init()` time (`initShikiMonacoTokenizer` warns "Theme not found" otherwise). The internal highlighter has `loadThemeFromCDN()` but it isn't exposed publicly. If upstream exposes it, lift the "declare all themes upfront" restriction.
- [ ] **Completion suggest-widget browser test** — completion _logic_ is unit-tested; driving Monaco's suggest widget end-to-end in the browser suite was skipped as flaky. Revisit with a stable approach.
- [ ] **`modern-monaco/core` variant** — optional slimmer entry that skips built-in LSP/grammars for bundle-size-sensitive consumers.
