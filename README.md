# modern-monaco-svelte

Svelte 5 components for [modern-monaco](https://github.com/esm-dev/modern-monaco) — a modernized Monaco Editor with Shiki syntax highlighting, no worker/CSS/bundler configuration, built-in LSP, and SSR support.

- **`MonacoEditor`** — thin wrapper: `bind:value`, reactive `theme`/`language`, full escape hatch to the raw monaco API
- **`MarkdownEditor`** — drop-in markdown editor: formatting shortcuts, snippet completions, list auto-continuation, live `**bold**`/`*italic*` styling
- **`LazyMonacoEditor`** — modern-monaco's lazy/SSR mode: zero-flash server-prerendered editors
- **Workspaces** — multi-file editing with a virtual filesystem (IndexedDB), history navigation, and a reactive file explorer helper
- Editors follow the system's `prefers-color-scheme` by default (live)

## Install

```sh
bun add modern-monaco-svelte modern-monaco
```

`modern-monaco` is a peer dependency. No vite/bundler configuration is needed — editor modules, grammars, and themes load from [esm.sh](https://esm.sh) at runtime (configurable via the `cdn` init option).

## Markdown editor (the drop-in)

```svelte
<script lang="ts">
	import { MarkdownEditor } from 'modern-monaco-svelte';

	let content = $state('# Hello\n');
</script>

<MarkdownEditor bind:value={content} class="h-96 rounded border" />
```

Ships with Cmd/Ctrl+B/I/E/K/Shift+X formatting, heading/link/image/code-block completions, list continuation on Enter, and inline bold/italic decorations — each toggleable via `shortcuts`, `completions`, `listContinuation`, `inlineDecorations`.

## Generic editor

```svelte
<script lang="ts">
	import { MonacoEditor } from 'modern-monaco-svelte';

	let code = $state('console.log("hi")');
</script>

<MonacoEditor
	bind:value={code}
	language="typescript"
	options={{ minimap: { enabled: false } }}
	onready={(editor, monaco) => {
		/* raw monaco API */
	}}
	class="h-96"
/>
```

Size the editor through the `class` prop (the container is `position: relative` with the editor filling it).

`value` is two-way bound: editor edits flow out, and external assignments flow back in. An external change (e.g. a SvelteKit query refresh rewriting the bound value mid-edit) is applied as an undoable edit that **preserves the undo stack and the cursor/scroll position** — it won't reset the editor or snap the cursor to the top.

## Theming

Without a `theme` prop, editors follow `prefers-color-scheme` live, using `themeLight`/`themeDark` (defaults: `vitesse-light`/`vitesse-dark`). An explicit `theme` always wins:

```svelte
<MarkdownEditor
	bind:value
	theme={dark ? 'rose-pine-moon' : 'rose-pine-dawn'}
	themes={['rose-pine-moon', 'rose-pine-dawn']}
/>
```

If your app already tracks light/dark itself (e.g. [mode-watcher](https://github.com/svecosystem/mode-watcher) or a user toggle), pass `dark` to drive the `themeLight`/`themeDark` choice instead of `prefers-color-scheme` — no need to assemble the theme string yourself:

```svelte
<script lang="ts">
	import { mode } from 'mode-watcher';
</script>

<MarkdownEditor bind:value dark={mode.current === 'dark'} />
```

`dark` is ignored when an explicit `theme` is set, and leaving it `undefined` keeps the default `prefers-color-scheme` behavior.

modern-monaco can only switch between themes registered at init — list every theme you switch between in `themes`, or register them early:

```ts
import { preloadMonaco } from 'modern-monaco-svelte';

// e.g. in a root layout's onMount — also warms up the editor
preloadMonaco({ themes: ['rose-pine-moon', 'rose-pine-dawn'] });
```

Init is page-global: options from all editors mounting before the first init resolves are merged; later additions are ignored with a warning.

## Workspaces (multi-file)

```svelte
<script lang="ts">
	import { Workspace } from 'modern-monaco';
	import { MonacoEditor, WorkspaceState } from 'modern-monaco-svelte';

	// browser-only (IndexedDB); files persist across reloads
	const workspace = new Workspace({
		name: 'my-project',
		initialFiles: { 'README.md': '# Hi\n', 'src/main.ts': 'export {}\n' },
		entryFile: 'README.md'
	});
	const explorer = new WorkspaceState(workspace);
</script>

{#each explorer.files as path (path)}
	<button onclick={() => explorer.open(path)}>{path}</button>
{/each}

<MonacoEditor {workspace} file={explorer.current} followHistory class="h-96" />
```

`file` is bindable and reactive (switching saves/restores per-file cursor and scroll state); `followHistory` wires the editor to `workspace.history` (`back()`/`forward()`/`push()`). Languages derive from filenames.

## Lazy mode & SSR

`LazyMonacoEditor` renders modern-monaco's `<monaco-editor>` web component — Shiki-highlighted code appears while the editor loads in the background. For zero flash, pre-render on the server:

```ts
// +page.server.ts
import { renderMarkdownEditor } from 'modern-monaco-svelte/ssr';

export const load = async ({ request }) => ({
	editorHtml: await renderMarkdownEditor('# Pre-rendered\n', {
		userAgent: request.headers.get('user-agent') ?? undefined
	})
});
```

```svelte
<script lang="ts">
	import { LazyMonacoEditor } from 'modern-monaco-svelte';

	let { data } = $props();
</script>

<LazyMonacoEditor html={data.editorHtml} class="h-96" />
```

Lazy mode exposes no editor instance (upstream limitation): no `bind:value` or runtime theme switching — use `MonacoEditor` when you need those. With a `workspace`, content changes can be observed via the `onchange` prop.

## Demos

```sh
git clone https://github.com/mastermakrela/modern-monaco-svelte
cd modern-monaco-svelte && bun install && bun run dev
```

- `/` — markdown editor with explicit theme toggle
- `/workspace` — multi-file explorer, history navigation
- `/lazy` — SSR + hydration and client-side lazy mode

## License

[MIT](./LICENSE)
