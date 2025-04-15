import { CLASS_PREFIX } from "../content/const";
import { injectDynamicTheme } from "../content/core";

if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

let observer;
const varSet = new Set();

export async function setupListener() {
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
    if (observer instanceof MutationObserver) {
        observer.disconnect();
        observer = null;
    }

    if (theme === "light") {
        document.documentElement.classList.remove(CLASS_PREFIX);
    }

    if (theme === "dark") {
        document.documentElement.classList.add(CLASS_PREFIX);
        await injectDynamicTheme(document, varSet);
        document.querySelector("style.dark-bili-early")?.remove();
        observer = observeRoot();
    }
}

async function observeRoot() {
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(item => {
                    injectDynamicTheme(item, varSet);
                });
            }
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return observer;
}
