<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { ui } from '$lib/ui.svelte.js';

	let { children } = $props();

	// `reload: true` marks pages whose editors need their own modern-monaco
	// init()/lazy() configuration (themes, workspace, LSP config, or a
	// different entry point). Init is page-global — whichever init runs first
	// in a page session wins — so crossing into or out of such a page forces a
	// full reload instead of an SPA transition.
	const groups = [
		{
			label: 'Editors',
			links: [
				{ href: '/', label: 'Markdown & code', reload: false },
				{ href: '/diff', label: 'Diff', reload: false },
				{ href: '/themes', label: 'Theme switcher', reload: true }
			]
		},
		{
			label: 'Workspaces',
			links: [
				{ href: '/workspace', label: 'Multi-file workspace', reload: false },
				{ href: '/workspace-rows', label: 'From DB rows', reload: false }
			]
		},
		{
			label: 'Editing features',
			links: [
				{ href: '/intellisense', label: 'IntelliSense', reload: true },
				{ href: '/multi-cursor', label: 'Multi-cursor', reload: true },
				{ href: '/visual-aids', label: 'Visual aids', reload: false },
				{ href: '/conveniences', label: 'Conveniences', reload: true }
			]
		},
		{
			label: 'Loading modes',
			links: [
				{ href: '/lazy', label: 'Lazy + SSR', reload: true },
				{ href: '/core', label: 'modern-monaco/core', reload: true }
			]
		},
		{
			label: 'Project',
			links: [{ href: '/changelog', label: 'Changelog', reload: false }]
		}
	] as const;

	type NavLink = (typeof groups)[number]['links'][number];
	const allLinks: NavLink[] = groups.flatMap((group) => [...group.links]);
	// Leaving a reload page must also reload (its engine state can't survive
	// into an SPA transition), so every link reloads while standing on one.
	const onReloadPage = $derived(
		allLinks.some((link) => link.reload && page.url.pathname === resolve(link.href))
	);

	let menuOpen = $state(false);
</script>

<div class="app" class:dark={ui.dark}>
	<header>
		<button
			class="menu-toggle"
			onclick={() => (menuOpen = !menuOpen)}
			aria-expanded={menuOpen}
			aria-controls="site-nav"
		>
			{menuOpen ? 'Close' : 'Menu'}
		</button>
		<a class="brand" href={resolve('/')} data-sveltekit-reload={onReloadPage ? '' : undefined}>
			modern-monaco<span class="brand-suffix">-svelte</span>
		</a>
		<div class="header-links">
			<a href="https://github.com/mastermakrela/modern-monaco-svelte">GitHub</a>
			<a href="https://www.npmjs.com/package/modern-monaco-svelte">npm</a>
			<button
				class="theme-toggle"
				onclick={() => (ui.dark = !ui.dark)}
				aria-label={ui.dark ? 'Switch to light theme' : 'Switch to dark theme'}
			>
				{ui.dark ? '☀' : '☾'}
			</button>
		</div>
	</header>

	<div class="body">
		<nav id="site-nav" class:open={menuOpen}>
			{#each groups as group (group.label)}
				<div class="group">
					<span class="group-label">{group.label}</span>
					{#each group.links as link (link.href)}
						<a
							href={resolve(link.href)}
							aria-current={page.url.pathname === resolve(link.href) ? 'page' : undefined}
							data-sveltekit-reload={link.reload || onReloadPage ? '' : undefined}
							onclick={() => (menuOpen = false)}
						>
							{link.label}
						</a>
					{/each}
				</div>
			{/each}
		</nav>

		<main>
			{@render children()}

			<footer>
				<a href="https://github.com/mastermakrela/modern-monaco-svelte">GitHub</a>
				<span aria-hidden="true">·</span>
				<a href="https://www.npmjs.com/package/modern-monaco-svelte">npm</a>
				<span aria-hidden="true">·</span>
				<span>created by <a href="https://mastermakrela.com/">mastermakrela</a></span>
			</footer>
		</main>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
	}

	.app {
		/* light */
		--bg: #fdfdfc;
		--surface: #f4f4f2;
		--text: #1d1f21;
		--muted: #5d6167;
		--border: #1d1f2114;
		--border-strong: #1d1f2126;
		/* Svelte orange, darkened enough for AA contrast on the light bg */
		--accent: #d63400;
		--accent-soft: #ff3e0014;

		min-height: 100vh;
		display: flex;
		flex-direction: column;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			sans-serif;
		background: var(--bg);
		color: var(--text);
	}

	.app.dark {
		--bg: #121314;
		--surface: #191b1c;
		--text: #e6e6e4;
		--muted: #9ba0a6;
		--border: #e6e6e414;
		--border-strong: #e6e6e426;
		--accent: #ff3e00;
		--accent-soft: #ff3e0022;
	}

	header {
		display: flex;
		align-items: center;
		gap: 1rem;
		height: 3.5rem;
		padding: 0 1.25rem;
		border-bottom: 1px solid var(--border);
	}

	.brand {
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		text-decoration: none;
		color: var(--text);
	}

	.brand-suffix {
		color: var(--accent);
	}

	.header-links {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-left: auto;
		font-size: 0.85rem;
	}

	.header-links a {
		color: var(--muted);
		text-decoration: none;
		transition: color 150ms ease-out;
	}

	.header-links a:hover {
		color: var(--text);
	}

	.theme-toggle,
	.menu-toggle {
		font: inherit;
		cursor: pointer;
		border: 1px solid var(--border-strong);
		border-radius: 0.375rem;
		background: transparent;
		color: var(--text);
		transition: border-color 150ms ease-out;
	}

	.theme-toggle {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		font-size: 0.9rem;
		line-height: 1;
	}

	.theme-toggle:hover,
	.menu-toggle:hover {
		border-color: var(--accent);
	}

	.menu-toggle {
		display: none;
		padding: 0.3rem 0.7rem;
		font-size: 0.85rem;
	}

	.body {
		flex: 1;
		display: grid;
		grid-template-columns: 14rem minmax(0, 1fr);
		width: 100%;
		max-width: 90rem;
		margin: 0 auto;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem 1rem 1.5rem 1.25rem;
		border-right: 1px solid var(--border);
		align-self: start;
		position: sticky;
		top: 0;
		max-height: 100vh;
		overflow-y: auto;
		box-sizing: border-box;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.group-label {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--muted);
		padding: 0 0.5rem;
		margin-bottom: 0.25rem;
	}

	nav a {
		font-size: 0.85rem;
		text-decoration: none;
		color: var(--muted);
		padding: 0.3rem 0.5rem;
		border-radius: 0.375rem;
		transition:
			color 150ms ease-out,
			background 150ms ease-out;
	}

	nav a:hover {
		color: var(--text);
		background: var(--surface);
	}

	nav a[aria-current='page'] {
		color: var(--accent);
		background: var(--accent-soft);
		font-weight: 550;
	}

	main {
		min-width: 0;
		padding: 1.75rem 2rem 0;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		padding: 2.5rem 0 1.5rem;
		color: var(--muted);
		font-size: 0.85rem;
	}

	footer a {
		color: inherit;
	}

	@media (max-width: 899px) {
		.menu-toggle {
			display: block;
		}

		.body {
			grid-template-columns: minmax(0, 1fr);
		}

		nav {
			display: none;
			position: static;
			max-height: none;
			border-right: none;
			border-bottom: 1px solid var(--border);
		}

		nav.open {
			display: flex;
		}

		main {
			padding: 1.5rem 1.25rem 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.app * {
			transition-duration: 0.01ms !important;
		}
	}
</style>
