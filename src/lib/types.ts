import type { init, InitOptions } from 'modern-monaco';

/** The monaco namespace as returned by modern-monaco's `init()`. */
export type Monaco = Awaited<ReturnType<typeof init>>;

/** A standalone code editor instance. */
export type MonacoCodeEditor = ReturnType<Monaco['editor']['create']>;

/** Monaco's `IStandaloneEditorConstructionOptions` (passed to `editor.create`). */
export type EditorOptions = NonNullable<Parameters<Monaco['editor']['create']>[1]>;

export interface IDisposable {
	dispose(): void;
}

export type { InitOptions };
