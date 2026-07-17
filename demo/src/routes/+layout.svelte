<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { ui } from '$lib/ui.svelte.js';

	let { children } = $props();

	const links = [
		{ href: '/', label: 'Markdown & code' },
		{ href: '/diff', label: 'Diff' },
		{ href: '/workspace', label: 'Workspace' },
		{ href: '/workspace-rows', label: 'Workspace from DB rows' },
		{ href: '/core', label: 'modern-monaco/core' },
		{ href: '/changelog', label: 'Changelog' }
	] as const;

	// modern-monaco/core shares its engine with the default modern-monaco used
	// everywhere else in this demo — force a full reload crossing that
	// boundary in either direction, or an SPA transition would corrupt
	// whichever entry point loaded second.
	const onCorePage = $derived(page.url.pathname === resolve('/core'));
</script>

<div class="app" class:dark={ui.dark}>
	<header>
		<a class="brand" href={resolve('/')} data-sveltekit-reload={onCorePage ? '' : undefined}>
			modern-monaco-svelte
		</a>
		<nav>
			{#each links as link (link.href)}
				<a
					href={resolve(link.href)}
					aria-current={page.url.pathname === resolve(link.href)}
					data-sveltekit-reload={link.href === '/core' || onCorePage ? '' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</nav>
		<button onclick={() => (ui.dark = !ui.dark)}>
			{ui.dark ? '☀ Light' : '☾ Dark'}
		</button>
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<a href="https://github.com/mastermakrela/modern-monaco-svelte">GitHub</a>
		<span>·</span>
		<a href="https://www.npmjs.com/package/modern-monaco-svelte">npm</a>
		<span>·</span>
		<span>created by <a href="https://mastermakrela.com/">mastermakrela</a></span>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		font-family: system-ui, sans-serif;
		background: #fff;
		color: #1a1a1a;
	}

	.app.dark {
		background: #121212;
		color: #e6e6e6;
	}

	header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 0.75rem 1.5rem;
		border-bottom: 1px solid #8883;
	}

	.brand {
		font-weight: 600;
		text-decoration: none;
		color: inherit;
	}

	nav {
		display: flex;
		gap: 1rem;
		margin-right: auto;
	}

	nav a {
		text-decoration: none;
		color: inherit;
		opacity: 0.7;
		padding-bottom: 2px;
		border-bottom: 2px solid transparent;
	}

	nav a[aria-current='true'] {
		opacity: 1;
		border-bottom-color: currentColor;
	}

	button {
		font: inherit;
		cursor: pointer;
		padding: 0.35rem 0.75rem;
		border-radius: 0.4rem;
		border: 1px solid #8886;
		background: transparent;
		color: inherit;
	}

	main {
		flex: 1;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		padding: 1.5rem;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		padding: 1.5rem;
		opacity: 0.7;
		font-size: 0.9rem;
	}

	footer a {
		color: inherit;
	}
</style>
