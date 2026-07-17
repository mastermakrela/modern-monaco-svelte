import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { PageServerLoad } from './$types.js';

const changelogPath = fileURLToPath(new URL('../../../CHANGELOG.md', import.meta.url));

export const load: PageServerLoad = async () => {
	return { changelog: await readFile(changelogPath, 'utf-8') };
};
