# Blocked on upstream

Everything else originally tracked here shipped by 0.5.0. These three remain
open only because upstream `modern-monaco` (0.4.2) doesn't expose the needed
API yet — revisit each when it does.

- [ ] **Lazy-mode editor handle** — upstream's `<monaco-editor>` element keeps the created editor instance private (no property, no event), so `LazyMonacoEditor` cannot offer `bind:value`, theme switching, or `onready`. If upstream exposes the instance (or an event), add them.
- [ ] **On-demand theme loading** — modern-monaco's patched `monaco.editor.setTheme()` only knows themes registered at `init()` time (`initShikiMonacoTokenizer` warns "Theme not found" otherwise). The internal highlighter has `loadThemeFromCDN()` but it isn't exposed publicly. If upstream exposes it, lift the "declare all themes upfront" restriction.
- [ ] **Multi-file diff** — upstream exposes `monaco.editor.createMultiFileDiffEditor(domElement, override)`, but it's typed `: any` and immature (no options/model surface). Revisit when upstream firms it up; a `MultiFileDiffEditor` could diff two workspace revisions.

## Demo & showcase backlog

Shipped: the whole backlog below landed in the demo-app overhaul (grouped
sidebar nav, redesigned landing page with a demo index, Svelte-orange accent,
persisted dark/light toggle, and `data-sveltekit-reload` boundaries for every
page that needs its own modern-monaco init).

- [x] **Edit history visualization** — the workspace demo now shows a clickable visited-file trail with back/forward (reconstructed locally from `history.onChange`; the upstream API only exposes `state.current`, no list/index).
- [x] **VS Code window API demo** — workspace demo's create/rename/remove flows use `workspace.showInputBox` (with validation) and `showQuickPick` (delete confirm), plus a "Go to file…" quick pick. Note: Monaco's quick-input service needs a focused editor — the page focuses the bound editor before each prompt.
- [x] **Lazy/SSR mode in the public demo app** — `/lazy` ports the internal dev route; the SSR markup is baked in at prerender time (build passes `fontFamily` since there's no user-agent at prerender).
- [x] **Live theme switcher** — `/themes`, 12 curated Shiki themes registered via the `themes` prop, plus a disabled "not registered" entry demonstrating the init-time constraint.
- [x] **"Editing evolved" showcase** — `/intellisense`: 3-file TS workspace, go-to-def/peek/rename/quick-fix + sticky scroll, minimap, bracket colorization, folding. Caveat: upstream 0.4.2 never registers its inlay-hints/CodeLens providers (adapters exist but are unwired), so those options are enabled but inert — noted on the page; revisit with the upstream items above.
- [x] **Multi-cursor & refactor-aware editing demo** — `/multi-cursor`: `linkedEditing`, `occurrencesHighlight: 'multiFile'`, `parameterHints`, and a live `multiCursorModifier` toggle.
- [x] **Visual aids demo** — `/visual-aids`: color decorators, `unicodeHighlight` with a real Trojan Source sample (homoglyph, zero-width space, RLO/PDI bidi override, written as `\u` escapes in source), bracket/indent guides.
- [x] **Editing conveniences demo** — `/conveniences`: `dragAndDrop`, `wordBasedSuggestions: 'currentDocument'`, and format-on-paste/type via `lsp.formatting`.
