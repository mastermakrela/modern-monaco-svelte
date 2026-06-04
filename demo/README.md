# modern-monaco-svelte demo

A small SvelteKit app showcasing the library, built as a fully static site for GitHub Pages.

- `/` — markdown editor + generic code editor
- `/diff` — diff editor (read-only/editable, side-by-side/inline)
- `/workspace` — multi-file workspace with a file explorer and history

It depends on the library in the parent directory via `"modern-monaco-svelte": "file:.."`, which resolves to the built `dist/`. Build the library first (from the repo root):

```sh
bun install
bun run prepack   # builds dist/
```

Then run the demo:

```sh
cd demo
bun install
bun run dev       # http://localhost:5173
```

## Static build / deploy

```sh
bun run build     # outputs to demo/build (adapter-static)
```

For GitHub Pages the site is served from a sub-path, so set the base path at build time:

```sh
BASE_PATH=/modern-monaco-svelte bun run build
```

The `.github/workflows/deploy-demo.yml` workflow does this automatically on pushes to `main` (build the library → build the demo with `BASE_PATH` → deploy to Pages). Enable it under **Settings → Pages → Source: GitHub Actions** in the repository.
