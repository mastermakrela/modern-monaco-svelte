# Future / deferred from v1

Items deliberately out of scope for the first version.

## TODO

- [ ] **`lazy()` / SSR mode component** — modern-monaco's `<monaco-editor>` web component (`lazy()`) pre-highlights with Shiki while the editor JS loads, and `modern-monaco/ssr` (`renderToWebComponent`) enables zero-flash server-prerendered editors (works on workerd/Cloudflare). Would be a separate `<LazyMonacoEditor>` component plus a SvelteKit SSR recipe (`+server.ts` / `load`-based pre-render + `hydrate()` on the client). Different lifecycle than `editor.create()`, so it needs its own design pass.
- [ ] **`Workspace` / multi-file support** — first-class wrapper around `Workspace` (virtual FS, IndexedDB persistence, browser history, `entryFile`). For now consumers can pass `workspace` through `preloadMonaco()` options themselves.
- [ ] **Theme pair convenience** — optional `themeLight`/`themeDark` props (+ a `mode` prop or `prefers-color-scheme` detection) on `MarkdownEditor`, so consumers don't have to wire mode-watcher themselves. v1 keeps a single reactive `theme` prop to stay dependency-free.
- [ ] **On-demand theme loading** — modern-monaco's patched `monaco.editor.setTheme()` only knows themes registered at `init()` time (`initShikiMonacoTokenizer` warns "Theme not found" otherwise). The internal highlighter has `loadThemeFromCDN()` but it isn't exposed publicly. If upstream exposes it, lift the "declare all themes upfront" restriction.
- [ ] **Completion suggest-widget browser test** — completion _logic_ is unit-tested; driving Monaco's suggest widget end-to-end in the browser suite was skipped as flaky. Revisit with a stable approach.
- [ ] **`modern-monaco/core` variant** — optional slimmer entry that skips built-in LSP/grammars for bundle-size-sensitive consumers.
