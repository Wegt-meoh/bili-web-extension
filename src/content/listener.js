import { CLASS_PREFIX } from "../content/const";
import { injectDynamicTheme } from "../content/core";

export async function setupListener() {
    if (typeof browser === 'undefined') {
        // eslint-disable-next-line
        var browser = chrome;
    }

    browser.runtime.onMessage.addListener((request) => {
        setTheme(request.theme);
    });

    try {
        const theme = await browser.runtime.sendMessage({ type: "QUERY_THEME" });
        await setTheme(theme);
    } catch (err) {
        console.error(err);
    }
}

async function setTheme(theme) {
    if (theme === "light") {
        document.querySelectorAll(`style.${CLASS_PREFIX}`).forEach(item => item.remove());
    }

    if (theme === "dark") {
        await injectDynamicTheme(document);
        document.querySelector("style.dark-bili-early")?.remove();
    }
}
