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
		paths: { base: process.env.BASE_PATH || '' }
	}
};

export default config;
