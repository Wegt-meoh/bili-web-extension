import { defineConfig } from "vite";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                content: "src/inject/index.js",
            },
            output: {
                entryFileNames: "content.js",
                format: "iife", // Immediately Invoked Function Expression (works in MV3)
            },
        },
        outDir: "dist",
    },
});

