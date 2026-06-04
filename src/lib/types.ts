import type { init, InitOptions } from 'modern-monaco';

/** The monaco namespace as returned by modern-monaco's `init()`. */
export type Monaco = Awaited<ReturnType<typeof init>>;

/** A standalone code editor instance. */
export type MonacoCodeEditor = ReturnType<Monaco['editor']['create']>;

/** Monaco's `IStandaloneEditorConstructionOptions` (passed to `editor.create`). */
export type EditorOptions = NonNullable<Parameters<Monaco['editor']['create']>[1]>;

/** A standalone diff editor instance. */
export type MonacoDiffEditorInstance = ReturnType<Monaco['editor']['createDiffEditor']>;

/** Monaco's `IStandaloneDiffEditorConstructionOptions` (passed to `editor.createDiffEditor`). */
export type DiffEditorOptions = NonNullable<Parameters<Monaco['editor']['createDiffEditor']>[1]>;

export interface IDisposable {
	dispose(): void;
}

export type { InitOptions };
