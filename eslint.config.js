import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";


export default defineConfig([
    { files: ["**/*.js"], },
    { languageOptions: { globals: globals.browser }, plugins: { js } },
    js.configs.recommended,
    {
        rules: {
            "no-unused-vars": "warn",
            "indent": ["error", 4, { "SwitchCase": 1 }],
            "semi": ["error", "always"]
        }
    },
    { ignores: ["node_modules", "dist"] }
]);
