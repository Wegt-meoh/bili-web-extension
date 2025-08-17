import { injectBasicStyle } from "./basicStyle";
import { addSystemThemeListener, cleanInjectedDarkTheme, setupDynamicDarkTheme } from "./core";
import { injectEarlyStyle } from "./early";
import { modifyNavigation } from "./onlyOneTab";
import { getSystemColorTheme } from "./utils";

if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

let removeSystemThemeListener = null;
let oldTheme = "";
let oldColor = "";

function onMessage(message) {
    // newTheme: 'light' | 'dark' | 'system'
    let { theme: newTheme } = message;

    if (!["light", "dark", "system"].includes(newTheme)) {
        throw new Error("onMessage got unexpected data", message);
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
            onMessage({ theme: getSystemColorTheme() });
        });
    }
    newColor = newTheme === "system" ? getSystemColorTheme() : newTheme;

    if (newColor === oldColor) {
        return;
    }
    oldColor = newColor;

    const bgDiv = document.querySelector(".bg");

    switch (newColor) {
        case "light":
            cleanInjectedDarkTheme();
            if (bgDiv) {
                bgDiv.setAttribute("style", bgDiv.getAttribute("style")?.replace("bg_dark.png", "bg.png"));
            }
            break;
        case "dark":
            cleanInjectedDarkTheme();
            setupDynamicDarkTheme(document);
            if (bgDiv) {
                bgDiv.setAttribute("style", bgDiv.getAttribute("style")?.replace("bg.png", "bg_dark.png"));
            }
            break;
        default:
    }
}


injectBasicStyle();
//injectEarlyStyle();

document.addEventListener("DOMContentLoaded", async () => {
    const theme = await browser.runtime.sendMessage({ type: "QUERY_THEME", hostname: location.hostname });
    browser.runtime.onMessage.addListener(onMessage);
    onMessage({ theme });
});
