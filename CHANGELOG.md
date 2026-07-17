# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-07-17

### Added

- `MonacoDiffEditor` — side-by-side (or inline) diff of two sources. Takes either two strings (`original`/`modified` + `language`, with optional per-side `originalLanguage`/`modifiedLanguage`) or two `workspace` files (`originalFile`/`modifiedFile`, languages derived from filenames); the two input modes can be mixed per side. `readOnly` (default `true`) is a pure preview; set it to `false` to edit the modified side with `bind:modified` (the original always stays read-only). Reuses the shared theme machinery (`theme`/`themeLight`/`themeDark`/`dark`/`themes`) and exposes the raw instance via `bind:editor`/`onready`. New `DiffEditorOptions` and `MonacoDiffEditorInstance` types exported.
- `WorkspaceState` write helpers: `create(path, content)` (creates missing parent directories, throws on an existing path), `rename(oldPath, newPath, { overwrite })`, and `remove(path, { recursive })` — both fix up `current`/`workspace.history` in place when the affected file is the one currently open.
- `modern-monaco-svelte/core` subpath — an opt-in path to modern-monaco's slim `modern-monaco/core` entry (~16KB, no bundled grammars/themes/LSP) for bundle-size-sensitive apps: `preloadMonacoCore()` / `ensureLazyEditorCore()`, plus re-exports of `registerSyntax()` / `registerTheme()` / `registerLSPProvider()`. Shares its engine and theme/syntax registries with the default `modern-monaco` entry — mixing both on one page/SPA session now throws instead of silently corrupting the running editor. New `/core` demo route.
- `resolveServerColorScheme(request)` (from `modern-monaco-svelte/ssr`) — resolves the client's real light/dark preference on the server from the `Sec-CH-Prefers-Color-Scheme` client hint (falling back to a `color-scheme` cookie) for picking `options.theme` before pre-rendering. Pair with the new `src/hooks.server.ts` recipe (sets `Accept-CH`/`Critical-CH` so the browser starts sending the hint) — see `renderEditor`'s JSDoc. The `/lazy` demo now uses this instead of always guessing `vitesse-dark`.
- `/workspace-rows` demo route: any array of `{ uuid, name, content }` objects (e.g. rows from a database) can back a workspace — edit a file in the editor or edit the JSON directly, both stay live via a derived preview.

### Changed

- The `options` prop on `MonacoEditor` and `MonacoDiffEditor` is now reactive — changes are applied live via `editor.updateOptions()` (previously they only took effect at construction). This makes runtime toggles like `options={{ readOnly }}` (use the editor as a code block) and the diff editor's `renderSideBySide` (split ↔ inline) work without remounting.

## [0.4.0] - 2026-06-03

### Added

- `dark` prop on `MonacoEditor`/`MarkdownEditor` — drives the `themeLight`/`themeDark` choice from your own source (e.g. mode-watcher, a user toggle) instead of `prefers-color-scheme`. Ignored when an explicit `theme` is set; `undefined` keeps the default system-following behavior. `resolveTheme()` gains a matching optional `dark` argument.

### Changed

- External `value` changes are now applied as an undoable edit that preserves the undo stack and cursor/scroll position, instead of `editor.setValue()` (which reset the undo history and snapped the cursor to the top). This keeps the editor usable when a bound value is rewritten mid-edit — e.g. a SvelteKit single-flight query refresh.

## [0.3.0] - 2026-06-02

### Added

- Editors without an explicit `theme` now follow the system's `prefers-color-scheme` — live in init mode (`MonacoEditor`/`MarkdownEditor` switch when the OS setting changes), at mount in lazy mode (`LazyMonacoEditor`; the web component offers no handle to re-theme later). New `themeLight`/`themeDark` props (defaults: `vitesse-light`/`vitesse-dark`) customize the pair; an explicit `theme` behaves exactly as before.
- `systemPrefersDark()` / `resolveTheme()` and `DEFAULT_LIGHT_THEME` / `DEFAULT_DARK_THEME` exported.

### Changed

- Previously, editors without a `theme` always used modern-monaco's bundled dark default; they now respect the system setting (on the server / during SSR the dark fallback is kept).
- `preloadMonaco()` always registers the default light/dark pair so prefers-color-scheme editors work regardless of mount order (vitesse-dark ships bundled; vitesse-light costs one small theme-JSON fetch at init).

## [0.2.1] - 2026-06-02

### Fixed

- Workspace-backed editors now work when mounted **after** monaco was already initialized (e.g. after SPA navigation from a page with a plain editor). Previously the workspace was silently dropped — `openTextDocument()` never resolved and the editor stayed empty — with a spurious "Monaco is already initialized" console warning. The new `attachWorkspace()` (exported, used automatically by `MonacoEditor`) wires the workspace into the running monaco instance; note that late attachment skips the LSP filesystem integration — call `preloadMonaco({ workspace })` early if you need import completions.
- Opening a file from a freshly constructed workspace no longer races the asynchronous `initialFiles` IndexedDB seeding (bounded not-found retry).
- File opens are serialized, target the owning editor explicitly (instead of upstream's focused-editor guess — relevant for multi-editor layouts), and no longer log errors when interrupted by unmount.

## [0.2.0] - 2026-06-02

### Added

- Workspace / multi-file support for `MonacoEditor` (and `MarkdownEditor` via passthrough): new `workspace`, `file` (bindable, reactive — switching swaps models with per-file cursor/scroll state saved and restored via `workspace.viewState`), and `followHistory` props (opening files pushes `workspace.history` entries; `back()`/`forward()`/`push()` drive the editor and update `file`). With a workspace, `bind:value` follows the open file and languages derive from filenames; the `language` prop is ignored.
- `WorkspaceState` — reactive (runes) view of a workspace for file trees and tab bars: `files` tracks the filesystem via `fs.watch`, `current` tracks `workspace.history`, plus `open()`, `refresh()`, `dispose()`. Browser-only, like workspaces themselves.
- `listWorkspaceFiles(fs)` — recursive sorted file listing; `workspacePath(uriOrPath)` — normalizes `file:///` history URIs to bare paths.
- `/workspace` demo route: sidebar file explorer, file creation, history back/forward, multi-language switching.

### Notes

- `workspace.history` stores `file:///` URIs internally; all component/state APIs accept and expose bare paths (`src/main.ts`).

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
