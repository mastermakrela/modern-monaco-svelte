# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-02

### Added

- `LazyMonacoEditor` — wrapper around modern-monaco's `lazy()` / `<monaco-editor>` web-component mode with three content sources: server-rendered `html` (zero-flash hydration), a `workspace` (+ optional `filename`, with `onchange` observed via `workspace.fs.watch`), or embedded `value`/`language` code. Lazy mode loads the editor in the background and exposes no editor instance — use `MonacoEditor` when you need `bind:value` or the raw API.
- `modern-monaco-svelte/ssr` subpath (server-only): `renderEditor()` and `renderMarkdownEditor()` (markdown defaults pre-applied) wrapping `renderToWebComponent`, plus re-exports of `renderToString` / `renderToWebComponent`. Pair with `<LazyMonacoEditor html={...}>` from a `load` function.
- `ensureLazyEditor()` — page-global one-shot `lazy()` initializer with the same option-merging semantics as `preloadMonaco()` (the two singletons are independent; avoid mixing init and lazy modes on one page).
- `lazyOptionsScript()` / `serializeLazyOptions()` — script-injection-safe serializer for the element's embedded options script.
- `markdownEditorDefaults` exported (shared between `MarkdownEditor` and `renderMarkdownEditor`).
- `/lazy` demo route showing SSR + hydration and client-only lazy mode.

## [0.0.1] - 2026-06-02

Initial release.

### Added

- `MonacoEditor` — thin Svelte 5 wrapper around [modern-monaco](https://github.com/esm-dev/modern-monaco)'s `init()` mode: `bind:value` two-way binding, `bind:editor`, reactive `theme` / `language` props, `options` passthrough (`IStandaloneEditorConstructionOptions`), `init` options, `onready(editor, monaco)` escape hatch, `loading` snippet, optional hidden form input via `name`.
- `MarkdownEditor` — drop-in markdown editor built on `MonacoEditor` with prose-friendly defaults (no minimap/line numbers/folding, word wrap, slim scrollbar) and toggleable extras: formatting shortcuts (Cmd/Ctrl+B/I/E/K/Shift+X), snippet completions (headings, code blocks, links, images), list auto-continuation on Enter, live `**bold**` / `*italic*` inline decorations.
- `preloadMonaco()` — page-global init singleton that merges options (themes, langs, lsp, …) from all callers registering before modern-monaco's `init()` resolves; warm it up early to register every theme the app switches between.
- Standalone markdown utilities: `wrapSelection`, `prefixLine`, `registerMarkdownActions`, `registerMarkdownCompletions` / `acquireMarkdownCompletions` (ref-counted), `setupMarkdownOnType`, `createMarkdownDecorations`, plus the pure helpers `computeInlineDecorations`, `matchListContinuation`, `markdownSnippetSuggestions`.

### Fixed

- Cmd/Ctrl+K link action now selects the `url` placeholder correctly (off-by-one inherited from the reference implementation selected `(ur`).
