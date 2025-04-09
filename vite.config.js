import { defineConfig } from "vite";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                content: "src/content/index.js",
                background: "src/background/index.js"
            },
            output: {
                entryFileNames: "[name].js",
                format: "es", // Immediately Invoked Function Expression (works in MV3),
            },
        },
        outDir: "dist",
    },
});

