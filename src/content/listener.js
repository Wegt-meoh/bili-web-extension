import { CLASS_PREFIX } from "../content/const";
import { injectDynamicTheme } from "../content/core";

if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

let observer;

export async function setupListener(target) {
    browser.runtime.onMessage.addListener((request) => {
        setTheme(request.theme, target);
    });

    try {
        const theme = await browser.runtime.sendMessage({ type: "QUERY_THEME" });
        await setTheme(theme, target);
    } catch (err) {
        console.error(err);
    }
}

async function setTheme(theme, target) {
    if (observer instanceof MutationObserver) {
        observer.disconnect();
        observer = null;
    }

    if (theme === "dark") {
        await injectDynamicTheme(target);
        target.querySelector("style.dark-bili-early")?.remove();
        observer = observeTarget(target);
    }
}

async function observeTarget(target) {
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(item => {
                    injectDynamicTheme(item);
                });
            }
        }
    });
    observer.observe(target, { childList: true, subtree: true });
    return observer;
}
