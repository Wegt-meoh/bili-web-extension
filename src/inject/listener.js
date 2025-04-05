import { CLASS_PREFIX } from "../inject/const";
import { injectDynamicTheme } from "../inject/dynamicTheme";

export async function setupListener() {
    if (typeof browser === 'undefined') {
        // eslint-disable-next-line
        var browser = chrome;
    }

    browser.runtime.onMessage.addListener((request) => {
        setTheme(request.theme);
    });

    try {
        const response = await browser.runtime.sendMessage({ type: "QUERY_THEME" });
        setTheme(response);
    } catch (err) {
        console.error(err);
    }
}

async function setTheme(theme) {
    switch (theme) {
        case 'light':
            document.querySelector(`style.${CLASS_PREFIX}`)?.remove();
            break;
        default:
            injectDynamicTheme();
            break;
    }
}
