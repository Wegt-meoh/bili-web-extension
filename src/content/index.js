import { injectBasicStyle } from "./basicStyle";
import { CLASS_PREFIX } from "./const";
import { addSystemThemeListener, cleanInjectedDarkTheme, setupDynamicDarkTheme } from "./core";
import { injectEarlyStyle } from "./early";
import { getSystemColorTheme, Logger } from "./utils";

if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

let removeSystemThemeListener = null;
let oldTheme = "";
let oldColor = "";

async function applyTheme(newTheme) {
    // newTheme: 'light' | 'dark' | 'system'

    if (!["light", "dark", "system"].includes(newTheme)) {
        Logger.err("apply got unexpected data", newTheme);
        newTheme = "light";
    }

    let newColor = "";

    if (oldTheme === newTheme) {
        return;
    }
    oldTheme = newTheme;

    if (removeSystemThemeListener !== null) {
        removeSystemThemeListener();
        removeSystemThemeListener = null;
    }

    if (newTheme === "system") {
        removeSystemThemeListener = addSystemThemeListener(() => {
            onMessage({ type: "APPLY_THEME", theme: getSystemColorTheme() });
        });
    }
    newColor = newTheme === "system" ? getSystemColorTheme() : newTheme;

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
            await setupDynamicDarkTheme(document);
            break;
        }
        default:
    }

}

async function onMessage(message) {
    const { type, theme } = message;

    switch (type) {
        case "APPLY_THEME":
            await applyTheme(theme);
            handleBilibiliBackgroundImage(theme === "system" ? getSystemColorTheme() : theme);
            break;
        case "ONACTIVE":
            await onMessage({ type: "APPLY_THEME", theme: await queryTheme() });
            break;
        default:
    }
}

async function queryTheme() {
    try {
        return await browser.runtime.sendMessage({ type: "QUERY_THEME", hostname: location.hostname });
    } catch (error) {
        Logger.err("got an error when query theme", error);
        return "light";
    }
}

function handleBilibiliBackgroundImage(theme) {
    if (!location.hostname.includes("bilibili.com")) {
        return;
    }

    const bgDiv = document.querySelector("#app .bg");
    const backgroundImageUrl = "url(https://i0.hdslb.com/bfs/static/stone-free/dyn-home/assets/bg.png@1c.avif);";
    const darkBackgroundImageUrl = "url(https://i0.hdslb.com/bfs/static/stone-free/dyn-home/assets/bg_dark.png@1c.avif);";
    if (!bgDiv) {
        return;
    }
    if (theme === "light") {
        bgDiv.setAttribute("style", "background-image:" + backgroundImageUrl);
    } else {
        bgDiv.setAttribute("style", "background-image:" + darkBackgroundImageUrl);
    }
}


injectBasicStyle();
injectEarlyStyle();

document.addEventListener("DOMContentLoaded", async () => {
    const theme = await queryTheme();
    browser.runtime.onMessage.addListener(onMessage);
    await onMessage({ type: "APPLY_THEME", theme });
    document.querySelectorAll("." + CLASS_PREFIX + "-early").forEach(e => e.remove());
});
