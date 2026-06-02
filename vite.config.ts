import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		// pre-bundle upfront so a mid-session discovery doesn't invalidate
		// module URLs (breaks vitest browser iframes; slows first dev load)
		include: ['modern-monaco', 'modern-monaco/ssr']
	},
	test: {
		onUnhandledError(error: { name?: string; message?: string }) {
			// editor.dispose() cancels modern-monaco's pending internal promises;
			// the escaping "Canceled" rejection is upstream noise
			if (error.name === 'Canceled' || error.message === 'Canceled') return false;
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
