/** Canonical deployed origin+base — used for absolute URLs in sitemap.xml. */
export const SITE_URL = 'https://mastermakrela.github.io/modern-monaco-svelte';

/**
 * Single source of truth for the demo's pages: the layout renders the sidebar
 * from it and /sitemap.xml is generated from it.
 *
 * `reload: true` marks pages whose editors need their own modern-monaco
 * init()/lazy() configuration (themes, workspace, LSP config, or a different
 * entry point). Init is page-global — whichever init runs first in a page
 * session wins — so crossing into or out of such a page forces a full reload
 * instead of an SPA transition.
 */
export const navGroups = [
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

export type NavLink = (typeof navGroups)[number]['links'][number];

export const allNavLinks: NavLink[] = navGroups.flatMap((group) => [...group.links]);
