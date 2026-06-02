# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-06-02

Initial release.

### Added

- `MonacoEditor` — thin Svelte 5 wrapper around [modern-monaco](https://github.com/esm-dev/modern-monaco)'s `init()` mode: `bind:value` two-way binding, `bind:editor`, reactive `theme` / `language` props, `options` passthrough (`IStandaloneEditorConstructionOptions`), `init` options, `onready(editor, monaco)` escape hatch, `loading` snippet, optional hidden form input via `name`.
- `MarkdownEditor` — drop-in markdown editor built on `MonacoEditor` with prose-friendly defaults (no minimap/line numbers/folding, word wrap, slim scrollbar) and toggleable extras: formatting shortcuts (Cmd/Ctrl+B/I/E/K/Shift+X), snippet completions (headings, code blocks, links, images), list auto-continuation on Enter, live `**bold**` / `*italic*` inline decorations.
- `preloadMonaco()` — page-global init singleton that merges options (themes, langs, lsp, …) from all callers registering before modern-monaco's `init()` resolves; warm it up early to register every theme the app switches between.
- Standalone markdown utilities: `wrapSelection`, `prefixLine`, `registerMarkdownActions`, `registerMarkdownCompletions` / `acquireMarkdownCompletions` (ref-counted), `setupMarkdownOnType`, `createMarkdownDecorations`, plus the pure helpers `computeInlineDecorations`, `matchListContinuation`, `markdownSnippetSuggestions`.

### Fixed

- Cmd/Ctrl+K link action now selects the `url` placeholder correctly (off-by-one inherited from the reference implementation selected `(ur`).
