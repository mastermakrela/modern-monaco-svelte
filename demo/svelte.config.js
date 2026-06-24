import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the app, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// Fully static build for GitHub Pages. `404.html` is the SPA fallback.
		adapter: adapter({ fallback: '404.html' }),
		// On GitHub Pages the site is served from /<repo>; the deploy workflow
		// sets BASE_PATH=/modern-monaco-svelte. Empty for local dev/preview.
		paths: { base: process.env.BASE_PATH || '' },
		// Resolve the parent package by its own name straight to the library
		// source. The demo lives *inside* the package root, so a `file:..`
		// dependency makes bun materialize the package (including this `demo/`)
		// into demo/node_modules/modern-monaco-svelte, recursing until the path
		// blows past PATH_MAX. Aliasing avoids node_modules entirely and feeds
		// both Vite bundling and the generated tsconfig (so svelte-check too).
		alias: { 'modern-monaco-svelte': '../src/lib' }
	}
};

export default config;
