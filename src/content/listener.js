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

let observer;

async function setTheme(theme) {
    if (observer instanceof MutationObserver) {
        observer.disconnect();
        observer = null;
    }

    if (theme === "light") {
        document.querySelectorAll(`style.${CLASS_PREFIX}`).forEach(item => item.remove());
    }

    if (theme === "dark") {
        await injectDynamicTheme(document);
        document.querySelector("style.dark-bili-early")?.remove();
        observer = observeRoot();
    }
}

async function observeRoot() {
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(item => {
                    injectDynamicTheme(item);
                });
            }
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return observer;
}
