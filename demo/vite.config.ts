import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the app, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Fully static build for GitHub Pages. `404.html` is the SPA fallback.
			adapter: adapter({ fallback: '404.html' }),

			// On GitHub Pages the site is served from /<repo>; the deploy workflow
			// sets BASE_PATH=/modern-monaco-svelte. Empty for local dev/preview.
			paths: { base: process.env.BASE_PATH || '' }
		})
	],
	resolve: {
		// Resolve the parent package by its own name straight to the library
		// source. The demo lives *inside* the package root, so a `file:..`
		// dependency makes bun materialize the package (including this `demo/`)
		// into demo/node_modules/modern-monaco-svelte, recursing until the path
		// blows past PATH_MAX. Aliasing avoids node_modules entirely; the
		// matching `paths` entry in tsconfig.json covers svelte-check.
		// (SvelteKit 3 deprecated its own `alias` option in favour of this.)
		alias: { 'modern-monaco-svelte': fileURLToPath(new URL('../src/lib', import.meta.url)) }
	}
});
