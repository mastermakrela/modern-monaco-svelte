<script lang="ts">
	import { MonacoEditor } from 'modern-monaco-svelte';
	import { ui } from '$lib/ui.svelte.js';

	let cssColors = $state(
		[
			':root {',
			'\t--brand-primary: #6366f1;',
			'\t--brand-secondary: #ec4899;',
			'\t--brand-accent: hsl(160, 84%, 39%);',
			'}',
			'',
			'.card {',
			'\tbackground: rgba(255, 255, 255, 0.08);',
			'\tborder: 1px solid #8884;',
			'\tcolor: rgb(226, 232, 240);',
			'\tbox-shadow: 0 4px 12px hsla(220, 60%, 10%, 0.4);',
			'}',
			'',
			'.card:hover {',
			'\tbackground: #1e293b;',
			'\tborder-color: hsl(217, 91%, 60%);',
			'}',
			'',
			'.badge {',
			'\tbackground: rebeccapurple;',
			'\tcolor: white;',
			'}',
			''
		].join('\n')
	);

	// The identifier below mixes two lookalike letters:
	//  - "admin" uses a plain Latin "a" (U+0061)
	//  - "\u0430dmin" uses a Cyrillic "\u0430" (U+0430) that renders identically
	//    in most fonts -- it is a *different* variable.
	// The string comparison further down hides a zero-width space (U+200B)
	// after "token", so two visually-identical strings compare unequal.
	// The final line embeds a real bidi override (RLO, U+202E) around a
	// reversed phrase, closed with a pop-directional-isolate (PDI, U+2069):
	// the characters actually stored are "edoc laer eht si sihT", but the
	// override makes them *render* as "This is the real code" -- the classic
	// "Trojan Source" (CVE-2021-42574) trick of separating what code says
	// from what it shows.
	let unicodeTricks = $state(
		[
			'// Homoglyph attack: two different identifiers that look the same.',
			'const admin = false;',
			'const \u0430dmin = true; // Cyrillic "\u0430" (U+0430), not Latin "a"',
			'',
			'export function isAdmin(user: string) {',
			'\treturn user === admin; // always checks the *real* admin above',
			'}',
			'',
			'// Zero-width space (U+200B) hidden right after "token" -- the two',
			'// strings below render identically but are not equal.',
			'const expected = "token";',
			'const actual = "token\u200b";',
			'console.log(expected === actual); // false',
			'',
			'// Bidi override (RLO … PDI): what you read here is not what is',
			'// actually stored in the file -- see the highlighted characters.',
			'/* \u202eedoc laer eht si sihT\u2069 */',
			'grantAccess(admin);',
			''
		].join('\n')
	);

	let nestedBrackets = $state(
		[
			'type Config = {',
			'\tserver: {',
			'\t\thttp: {',
			'\t\t\tport: number;',
			'\t\t\tmiddleware: {',
			'\t\t\t\tcors: {',
			'\t\t\t\t\torigins: string[];',
			'\t\t\t\t\tmethods: string[];',
			'\t\t\t\t};',
			'\t\t\t\tauth: {',
			'\t\t\t\t\tstrategies: {',
			'\t\t\t\t\t\tjwt: { secret: string; expiresIn: string };',
			'\t\t\t\t\t\toauth: { providers: { github: { id: string; secret: string } } };',
			'\t\t\t\t\t};',
			'\t\t\t\t};',
			'\t\t\t};',
			'\t\t};',
			'\t};',
			'};',
			'',
			'const config: Config = {',
			'\tserver: {',
			'\t\thttp: {',
			'\t\t\tport: 8080,',
			'\t\t\tmiddleware: {',
			'\t\t\t\tcors: {',
			'\t\t\t\t\torigins: ["https://example.com"],',
			'\t\t\t\t\tmethods: ["GET", "POST"]',
			'\t\t\t\t},',
			'\t\t\t\tauth: {',
			'\t\t\t\t\tstrategies: {',
			'\t\t\t\t\t\tjwt: { secret: "shh", expiresIn: "1h" },',
			'\t\t\t\t\t\toauth: {',
			'\t\t\t\t\t\t\tproviders: {',
			'\t\t\t\t\t\t\t\tgithub: { id: "abc", secret: "def" }',
			'\t\t\t\t\t\t\t}',
			'\t\t\t\t\t\t}',
			'\t\t\t\t\t}',
			'\t\t\t\t}',
			'\t\t\t}',
			'\t\t}',
			'\t}',
			'};',
			''
		].join('\n')
	);
</script>

<section>
	<h2>Color decorators</h2>
	<p>
		Every hex/<code>rgb()</code>/<code>hsl()</code> literal below gets an inline color swatch.
		Click one to open Monaco's native color picker and edit the value live.
	</p>
	<MonacoEditor
		bind:value={cssColors}
		language="css"
		dark={ui.dark}
		options={{
			colorDecorators: true,
			colorDecoratorsActivatedOn: 'clickAndHover',
			colorDecoratorsLimit: 500
		}}
		class="editor"
	>
		{#snippet loading()}
			<p class="loading">Loading editor…</p>
		{/snippet}
	</MonacoEditor>
</section>

<section>
	<h2>Unicode highlight (Trojan Source)</h2>
	<p>
		Homoglyphs, zero-width characters, and bidi overrides let source code <em>display</em>
		differently from how it actually reads and executes -- a class of attack formalized as
		"Trojan Source" (CVE-2021-42574). Monaco's <code>unicodeHighlight</code> squiggles every
		character below that isn't plain ASCII in this context; hover one to see why it's flagged.
	</p>
	<MonacoEditor
		bind:value={unicodeTricks}
		language="typescript"
		dark={ui.dark}
		options={{
			unicodeHighlight: {
				ambiguousCharacters: true,
				invisibleCharacters: true,
				includeComments: true,
				includeStrings: true
			}
		}}
		class="editor"
	>
		{#snippet loading()}
			<p class="loading">Loading editor…</p>
		{/snippet}
	</MonacoEditor>
</section>

<section>
	<h2>Guides &amp; bracket colorization</h2>
	<p>
		A deeply nested config type/object: matching brackets share a color across the whole pair
		(watch them change as you move the cursor), and vertical guides connect each indentation
		level back to the line that opened it.
	</p>
	<MonacoEditor
		bind:value={nestedBrackets}
		language="typescript"
		dark={ui.dark}
		options={{
			bracketPairColorization: { enabled: true },
			guides: {
				bracketPairs: true,
				indentation: true,
				highlightActiveIndentation: true
			}
		}}
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
		margin: 0 0 0.75rem;
		opacity: 0.8;
	}

	:global(.editor) {
		height: 22rem;
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
