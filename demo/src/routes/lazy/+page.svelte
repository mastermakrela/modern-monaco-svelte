<script lang="ts">
	import { LazyMonacoEditor } from 'modern-monaco-svelte';

	let { data } = $props();
</script>

<section>
	<h2>SSR + hydration (zero flash)</h2>
	<p>
		This markdown was highlighted with Shiki on the server via <code>renderMarkdownEditor</code>
		from <code>modern-monaco-svelte/ssr</code>, then hydrated by
		<code>&lt;LazyMonacoEditor html=&#123;...&#125;&gt;</code>. Because this demo is fully prerendered
		(adapter-static), that "server render" only ever happens once, at <strong>build time</strong> —
		there's no live request for it to read a color-scheme hint from, so it falls back to dark (same
		as modern-monaco's own default). View source — not the rendered DOM in devtools — to see the
		pre-highlighted markup that was baked into this static page.
	</p>
	<LazyMonacoEditor html={data.editorHtml} class="editor" />
</section>

<section>
	<h2>Client-side lazy mode</h2>
	<p>
		No <code>html</code> prop this time — the editor's markup and JavaScript load only once this
		component mounts in the browser, with no server step at all. It has no explicit
		<code>theme</code>, so it picks light or dark from the system preference at mount.
	</p>
	<LazyMonacoEditor
		value={`console.log("loaded lazily, no SSR");` + '\n'}
		language="javascript"
		class="editor"
	/>
</section>

<section>
	<h2>Trade-off vs <code>MonacoEditor</code></h2>
	<p>
		Both editors above are <code>&lt;LazyMonacoEditor&gt;</code>, a thin wrapper over
		<a href="https://github.com/esm-dev/modern-monaco">modern-monaco</a>'s own
		<code>&lt;monaco-editor&gt;</code> custom element, rather than a full Monaco instance booted
		eagerly like <code>MonacoEditor</code>/<code>MarkdownEditor</code> elsewhere in this demo. That's
		the appeal — smaller upfront JavaScript, and editors off-screen don't pay to load — but it's a
		real trade-off: with no editor instance to hold onto, there's no <code>bind:value</code>, and no
		way to switch themes after mount (only the system preference at load time). That limitation lives
		upstream in modern-monaco, not in this wrapper.
	</p>
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
		height: 16rem;
		border: 1px solid #8884;
		border-radius: 0.5rem;
	}
</style>
