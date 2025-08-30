import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
    plugins: [
        webExtension({
            manifest: 'manifest.json',
            browser: 'chrome', // Target browser: 'chrome', 'firefox', etc.
        }),
    ],
});
