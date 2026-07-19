<script lang="ts">
	import { browser } from '$app/environment';
	import { MonacoEditor, WorkspaceState } from 'modern-monaco-svelte';
	import { Workspace } from 'modern-monaco';
	import { ui } from '$lib/ui.svelte.js';

	// A distinct IndexedDB name so this page's workspace never collides with
	// the plain `workspace` demo (or any other page that persists files).
	const workspace = browser
		? new Workspace({
				name: 'modern-monaco-svelte-demo-intellisense',
				initialFiles: {
					'src/geometry.ts': `/**
 * geometry.ts — the file everyone else imports from.
 *
 * Try: put the cursor on \`Point\` below and press F2 — rename it and watch
 * shapes.ts and main.ts update too, across files, in one go.
 */

/** A point in 2D space. */
export interface Point {
	x: number;
	y: number;
}

/** Euclidean distance between two points. */
export function distance(a: Point, b: Point): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
}

/** The point halfway between \`a\` and \`b\`. */
export function midpoint(a: Point, b: Point): Point {
	return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// #region Circle
/** A circle described by its center and radius. */
export interface Circle {
	center: Point;
	radius: number;
}

/** Area enclosed by a circle. This region folds — try the gutter arrow. */
export function circleArea(circle: Circle): number {
	return Math.PI * circle.radius * circle.radius;
}
// #endregion
`,
					'src/shapes.ts': `/**
 * shapes.ts — builds on geometry.ts.
 *
 * Try: put the cursor on \`distance\` below and press Shift+F12 — peek every
 * place it's called (including main.ts) without leaving this file.
 */
import type { Point, Circle } from './geometry';
import { distance } from './geometry';

/** A rectangle defined by two opposite corners. */
export interface Rectangle {
	topLeft: Point;
	bottomRight: Point;
}

/** Width and height of a rectangle. */
export function rectangleSize(rect: Rectangle): { width: number; height: number } {
	return {
		width: Math.abs(rect.bottomRight.x - rect.topLeft.x),
		height: Math.abs(rect.bottomRight.y - rect.topLeft.y)
	};
}

/** Area of a rectangle. */
export function rectangleArea(rect: Rectangle): number {
	const { width, height } = rectangleSize(rect);
	return width * height;
}

/** Diagonal length of a rectangle, expressed via \`distance\` from geometry.ts. */
export function rectangleDiagonal(rect: Rectangle): number {
	return distance(rect.topLeft, rect.bottomRight);
}

export const unitCircle: Circle = { center: { x: 0, y: 0 }, radius: 1 };
`,
					'src/main.ts': `/**
 * main.ts — every LSP feature on this page is one keystroke away from here.
 * See the cheat sheet above the editor for the shortcuts.
 */
import type { Point } from './geometry';
import { distance, midpoint, circleArea } from './geometry';
import { rectangleArea, rectangleDiagonal, rectangleSize, type Rectangle } from './shapes';

// \`circleArea\` above is imported but never called — put the cursor on it
// and press Cmd/Ctrl+. (or click the lightbulb) for "Remove unused declaration".

const origin: Point = { x: 0, y: 0 };
const corner: Point = { x: 3, y: 4 };

// F12 on \`distance\` jumps to its definition in geometry.ts.
// Shift+F12 peeks every place it's called, cross-file, without leaving here.
console.log('distance:', distance(origin, corner));
console.log('midpoint:', midpoint(origin, corner));

const room: Rectangle = { topLeft: origin, bottomRight: { x: 12, y: 8 } };

console.log('area:', rectangleArea(room));
console.log('diagonal:', rectangleDiagonal(room));
console.log('size:', rectangleSize(room));

function describeCorner(rect: Rectangle): string {
	// typo: \`topLefft\` — Cmd/Ctrl+. offers "Change spelling to 'topLeft'".
	return \`top-left at (\${rect.topLefft.x}, \${rect.topLefft.y})\`;
}

describeCorner(room);
`
				},
				entryFile: 'src/main.ts'
			})
		: undefined;
	const explorer = workspace ? new WorkspaceState(workspace) : undefined;
</script>

<section>
	<h1>Editing evolved</h1>
	<p class="lede">
		Cross-file IntelliSense, powered by modern-monaco's built-in language server — no separate
		editor build, no manual wiring. Just point it at a multi-file TypeScript workspace.
	</p>

	<div class="cheatsheet">
		<dl>
			<div class="entry">
				<dt><kbd>F12</kbd></dt>
				<dd>Go to Definition — jump to where a symbol is declared, even in another file.</dd>
			</div>
			<div class="entry">
				<dt><kbd>Shift</kbd>+<kbd>F12</kbd></dt>
				<dd>Peek References — see every call site inline without leaving the file.</dd>
			</div>
			<div class="entry">
				<dt><kbd>F2</kbd></dt>
				<dd>Rename Symbol — renames every usage across the whole workspace at once.</dd>
			</div>
			<div class="entry">
				<dt><kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>.</kbd></dt>
				<dd>Quick Fix — the lightbulb offers fixes like removing an unused import.</dd>
			</div>
		</dl>
		<ul class="try">
			<li>Rename <code>Point</code> in <code>geometry.ts</code> — <code>main.ts</code> and
				<code>shapes.ts</code> follow.</li>
			<li>F12 on <code>distance</code> in <code>main.ts</code> — lands in <code>geometry.ts</code>.</li>
			<li>Quick fix the unused <code>circleArea</code> import, or the <code>topLefft</code> typo, in
				<code>main.ts</code>.</li>
			<li>Fold the <code>Circle</code> region in <code>geometry.ts</code> from the gutter arrow.</li>
		</ul>
	</div>

	{#if workspace && explorer}
		<div class="layout">
			<aside>
				<nav>
					{#each explorer.files as path (path)}
						<button class:active={path === explorer.current} onclick={() => explorer.open(path)}>
							{path}
						</button>
					{/each}
				</nav>
			</aside>

			<MonacoEditor
				{workspace}
				file={explorer.current}
				followHistory
				dark={ui.dark}
				class="editor"
				init={{
					lsp: {
						typescript: {
							compilerOptions: { strict: true }
						}
					}
				}}
				options={{
					minimap: { enabled: true },
					stickyScroll: { enabled: true },
					bracketPairColorization: { enabled: true },
					guides: { bracketPairs: true },
					folding: true,
					inlayHints: { enabled: 'on' },
					codeLens: true,
					fontSize: 14
				}}
			/>
		</div>
		<p class="caveat">
			Inlay hints and CodeLens are enabled above, but as of modern-monaco 0.4.2 its TypeScript
			language service doesn't register providers for either yet — expect no visible effect until
			that lands upstream. Everything else on this page (definitions, references, rename, quick
			fixes, folding, bracket colorization, sticky scroll, minimap) is wired through the same
			built-in LSP and works today.
		</p>
	{:else}
		<p class="loading">Workspaces are browser-only — loading…</p>
	{/if}
</section>

<style>
	section {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 1.4rem;
		margin: 0 0 0.5rem;
	}

	.lede {
		margin: 0 0 1.25rem;
		opacity: 0.8;
		max-width: 46rem;
	}

	.cheatsheet {
		display: grid;
		gap: 1rem;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		margin-bottom: 1.25rem;
		padding: 0.85rem 1rem;
		border: 1px solid #8884;
		border-radius: 0.5rem;
		background: #8881;
	}

	dl {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.entry {
		display: grid;
		grid-template-columns: 6.5rem 1fr;
		gap: 0.5rem;
		align-items: baseline;
	}

	dt {
		white-space: nowrap;
	}

	dd {
		margin: 0;
		font-size: 0.9rem;
		opacity: 0.85;
	}

	kbd {
		font: inherit;
		font-size: 0.8rem;
		padding: 0.05rem 0.4rem;
		border: 1px solid #8886;
		border-bottom-width: 2px;
		border-radius: 0.3rem;
		background: #8882;
	}

	.try {
		margin: 0;
		padding-left: 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.9rem;
		opacity: 0.85;
	}

	.try code {
		font-size: 0.85em;
	}

	.layout {
		display: grid;
		grid-template-columns: 12rem 1fr;
		gap: 1rem;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	nav button {
		text-align: left;
		padding: 0.35rem 0.5rem;
		border: 1px solid transparent;
		border-radius: 0.375rem;
		background: none;
		color: inherit;
		cursor: pointer;
		font: inherit;
	}

	nav button:hover {
		background: #8881;
	}

	nav button.active {
		border-color: #8884;
		background: #8882;
		font-weight: 600;
	}

	:global(.editor) {
		height: 42rem;
		border: 1px solid #8884;
		border-radius: 0.5rem;
	}

	.caveat {
		margin: 0.75rem 0 0;
		font-size: 0.85rem;
		opacity: 0.7;
	}

	.loading {
		color: #888;
	}

	@media (max-width: 40rem) {
		.cheatsheet {
			grid-template-columns: 1fr;
		}
	}
</style>
