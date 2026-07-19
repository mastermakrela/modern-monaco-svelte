import { browser } from '$app/environment';

/**
 * Shared dark/light choice, driven by the toggle in the layout and passed to
 * every editor's `dark` prop (so the demo, not the OS, decides). Persisted in
 * localStorage because several demo pages force full page reloads (their
 * editors need their own modern-monaco init), which would otherwise reset an
 * in-memory toggle on every crossing.
 */
const STORAGE_KEY = 'mms-demo-dark';

class Ui {
	#dark = $state(browser ? localStorage.getItem(STORAGE_KEY) !== '0' : true);

	get dark(): boolean {
		return this.#dark;
	}

	set dark(value: boolean) {
		this.#dark = value;
		if (browser) localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
	}
}

export const ui = new Ui();
