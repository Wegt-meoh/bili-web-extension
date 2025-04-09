import { CLASS_PREFIX } from "../content/const";
import { injectDynamicTheme } from "../content/core";

export async function setupListener() {
    if (typeof browser === 'undefined') {
        // eslint-disable-next-line
        var browser = chrome;
    }

    let theme;

    browser.runtime.onMessage.addListener((request) => {
        theme = request.theme;
        setTheme(theme);
    });

    try {
        theme = await browser.runtime.sendMessage({ type: "QUERY_THEME" });
        await setTheme(theme);
    } catch (err) {
        console.error(err);
    }
}

async function setTheme(theme) {
    document.querySelectorAll(`style.${CLASS_PREFIX}`).forEach(item => item.remove());
    if (theme === "dark") {
        await injectDynamicTheme();
    }
}
