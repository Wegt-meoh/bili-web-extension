import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig(({mode})=>({
    plugins: [
        webExtension({
            manifest: 'manifest.json',
            browser: 'chrome', // Target browser: 'chrome', 'firefox', etc.
        }),
    ],
    build: {
        emptyOutDir: true,
        sourcemap: mode === 'development',
        minify: mode === 'production'
    },
}));
