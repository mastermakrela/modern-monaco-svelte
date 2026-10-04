import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	],
	optimizeDeps: {
		// pre-bundle upfront so a mid-session discovery doesn't invalidate
		// module URLs (breaks vitest browser iframes; slows first dev load)
		include: ['modern-monaco', 'modern-monaco/ssr']
	},
	test: {
		onUnhandledError(error: { name?: string; message?: string; stack?: string }) {
			// editor.dispose() cancels modern-monaco's pending internal promises;
			// the escaping "Canceled" rejection is upstream noise
			if (error.name === 'Canceled' || error.message === 'Canceled') return false;
			// monaco's editor internals schedule async work (render frames,
			// timers) that can fire after editor.dispose() during fast test
			// teardown — those errors never reach wrapper code (seen mainly on
			// slower CI runners: "reading 'getWidgets'", "reading 'domNode'")
			if (error.stack?.includes('editor-core.mjs')) return false;
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/tests/unit/**/*.test.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'browser',
					include: ['src/tests/browser/**/*.test.ts'],
					// monaco init + CDN grammar/theme fetches (esm.sh) need headroom
					testTimeout: 30_000,
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }]
					}
				}
			}
		]
	}
});
