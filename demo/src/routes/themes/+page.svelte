<script lang="ts">
	import { MonacoEditor } from 'modern-monaco-svelte';

	// The curated set registered with the editor's `themes` prop at init time.
	// modern-monaco's patched `monaco.editor.setTheme()` can only switch to a
	// theme that was registered when the page's monaco instance was created —
	// this list IS the full set the picker below can offer.
	const themes = [
		{ id: 'vitesse-dark', label: 'Vitesse Dark', kind: 'dark' },
		{ id: 'vitesse-light', label: 'Vitesse Light', kind: 'light' },
		{ id: 'nord', label: 'Nord', kind: 'dark' },
		{ id: 'dracula', label: 'Dracula', kind: 'dark' },
		{ id: 'github-dark', label: 'GitHub Dark', kind: 'dark' },
		{ id: 'github-light', label: 'GitHub Light', kind: 'light' },
		{ id: 'one-dark-pro', label: 'One Dark Pro', kind: 'dark' },
		{ id: 'catppuccin-mocha', label: 'Catppuccin Mocha', kind: 'dark' },
		{ id: 'catppuccin-latte', label: 'Catppuccin Latte', kind: 'light' },
		{ id: 'tokyo-night', label: 'Tokyo Night', kind: 'dark' },
		{ id: 'monokai', label: 'Monokai', kind: 'dark' },
		{ id: 'solarized-light', label: 'Solarized Light', kind: 'light' }
	] as const;

	let index = $state(0);
	const active = $derived(themes[index]);

	function select(i: number) {
		index = i;
	}

	function prev() {
		index = (index - 1 + themes.length) % themes.length;
	}

	function next() {
		index = (index + 1) % themes.length;
	}

	const code = [
		'// A grab-bag of syntax to show off tokenization across themes.',
		"import type { Workspace } from 'modern-monaco';",
		'',
		'/**',
		' * Matches a semver-ish version string.',
		' * @see https://semver.org',
		' */',
		'const VERSION_RE = /^(\\d+)\\.(\\d+)\\.(\\d+)(-[\\w.]+)?$/;',
		'',
		'interface Release<T = unknown> {',
		'\tversion: string;',
		'\tnotes: string[];',
		'\tmeta?: T;',
		'}',
		'',
		'export class Changelog<T> implements Iterable<Release<T>> {',
		'\t#releases: Release<T>[] = [];',
		'',
		'\tadd(version: string, notes: string[], meta?: T): this {',
		'\t\tif (!VERSION_RE.test(version)) {',
		"\t\t\tthrow new Error(`invalid version: \"${version}\"`);",
		'\t\t}',
		'\t\tthis.#releases.push({ version, notes, meta });',
		'\t\treturn this;',
		'\t}',
		'',
		'\tasync *[Symbol.asyncIterator]() {',
		'\t\tfor (const release of this.#releases) yield release;',
		'\t}',
		'',
		'\t[Symbol.iterator]() {',
		'\t\treturn this.#releases[Symbol.iterator]();',
		'\t}',
		'}',
		'',
		'const log = new Changelog<{ breaking: boolean }>()',
		"\t.add('0.5.0', ['Add changelog page', 'Add core demo'], { breaking: false })",
		"\t.add('1.0.0', ['Stable API'], { breaking: true });",
		'',
		'for (const { version, notes } of log) {',
		'\tconsole.log(`%c${version}`, \'font-weight: bold\', notes.join(\', \'));',
		'}'
	].join('\n');
</script>

<section>
	<h2>Live theme switcher</h2>
	<p>
		modern-monaco's patched <code>monaco.editor.setTheme()</code> can only switch to a theme that
		was registered when the page's editor first initialized — so this page pre-registers a curated
		set of {themes.length} themes from
		<a href="https://shiki.style/themes" target="_blank" rel="noreferrer">Shiki's theme gallery</a>
		via the <code>themes</code> prop, and the picker below only offers those. Switching between them
		is instant because nothing needs to load. Because this editor is given an explicit
		<code>theme</code>, the app's light/dark toggle above doesn't affect it (only editors that omit
		<code>theme</code> follow <code>dark</code>/<code>prefers-color-scheme</code>).
	</p>

	<div class="picker">
		<button class="nav" onclick={prev} aria-label="Previous theme">‹</button>
		<div class="swatches">
			{#each themes as theme, i (theme.id)}
				<button
					class="swatch"
					class:active={i === index}
					aria-pressed={i === index}
					onclick={() => select(i)}
				>
					<span class="dot" class:light={theme.kind === 'light'}></span>
					{theme.label}
				</button>
			{/each}
			<button
				class="swatch not-registered"
				disabled
				title="'andromeeda' is a real Shiki theme, but it wasn't registered at init — switching to it would log a &quot;Theme not found&quot; warning instead of changing anything. Add it to the `themes` prop to enable it."
			>
				<span class="dot dark"></span>
				andromeeda (not registered)
			</button>
		</div>
		<button class="nav" onclick={next} aria-label="Next theme">›</button>
	</div>

	<MonacoEditor
		value={code}
		language="typescript"
		theme={active.id}
		themes={themes.map((t) => t.id)}
		class="editor"
	>
		{#snippet loading()}
			<p class="loading">Loading editor…</p>
		{/snippet}
	</MonacoEditor>
</section>

<style>
	section {
		margin-bottom: 2rem;
	}

	h2 {
		font-size: 1.1rem;
		margin: 0 0 0.25rem;
	}

	p {
		margin: 0 0 1rem;
		opacity: 0.8;
	}

	.picker {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.nav {
		font: inherit;
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		padding: 0.35rem 0.6rem;
		border-radius: 0.4rem;
		border: 1px solid #8886;
		background: transparent;
		color: inherit;
	}

	.swatches {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.swatch {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
		padding: 0.3rem 0.6rem;
		border-radius: 999px;
		border: 1px solid #8886;
		background: transparent;
		color: inherit;
	}

	.swatch.active {
		border-color: currentColor;
		font-weight: 600;
	}

	.swatch.not-registered {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.dot {
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: #1a1a1a;
		border: 1px solid #8886;
	}

	.dot.light {
		background: #fff;
	}

	:global(.editor) {
		height: 26rem;
		border: 1px solid #8884;
		border-radius: 0.5rem;
	}

	.loading {
		display: grid;
		place-items: center;
		height: 100%;
		margin: 0;
		color: #888;
	}
</style>
