import { MessageType } from "../utils/message";
import { handleBilibiliBackgroundImage, handleBilibiliVideo } from "./bilibili";
import { CLASS_PREFIX } from "./const";
import { cleanInjectedDarkTheme, setupDynamicDarkTheme } from "./core";
import { injectEarlyStyle } from "./early";
import { injectFallbackStyle } from "./fallback";
import { getSystemColorTheme, Logger } from "./utils";

if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

let oldColor = "";

const mediaMatches = window.matchMedia('(prefers-color-scheme: dark)');

function systemThemeOnChange() {
    onMessage({ type: MessageType.APPLY_THEME, theme: "system" });
}

async function applyTheme(newTheme) {
    // newTheme: 'light' | 'dark' | 'system'
    if (!["light", "dark", "system"].includes(newTheme)) {
        Logger.err("apply got unexpected data", newTheme);
        newTheme = "light";
    }

    mediaMatches.removeEventListener("change", systemThemeOnChange);

    if (newTheme === "system") {
        mediaMatches.addEventListener("change", systemThemeOnChange);
    }

    const newColor = newTheme === "system" ? getSystemColorTheme() : newTheme;

    if (newColor === oldColor) {
        return;
    }
    oldColor = newColor;

    switch (newColor) {
        case "light": {
            cleanInjectedDarkTheme();
            break;
        }
        case "dark": {
            cleanInjectedDarkTheme();
            injectFallbackStyle();
            await setupDynamicDarkTheme(document);
            break;
        }
        default:
    }

}

async function onMessage(message) {
    const { type, theme } = message;

    switch (type) {
        case MessageType.APPLY_THEME:
            await applyTheme(theme);
            handleBilibiliBackgroundImage(theme === "system" ? getSystemColorTheme() : theme);
            break;
        case MessageType.ONACTIVE:
            await onMessage({ type: MessageType.APPLY_THEME, theme: await queryTheme() });
            break;
        default:
    }
}

async function queryTheme() {
    try {
        return await browser.runtime.sendMessage({ type: MessageType.QUERY_THEME, hostname: location.hostname });
    } catch (error) {
        Logger.err("got an error when query theme", error);
        return "light";
    }
}

injectEarlyStyle();

document.addEventListener("DOMContentLoaded", async () => {
    handleBilibiliVideo();
    const theme = await queryTheme();
    browser.runtime.onMessage.addListener(onMessage);
    await onMessage({ type: MessageType.APPLY_THEME, theme });
    document.querySelectorAll("." + CLASS_PREFIX + "-early").forEach(e => e.remove());
});
