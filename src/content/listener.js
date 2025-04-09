import { CLASS_PREFIX } from "../content/const";
import { injectDynamicTheme } from "../content/core";

export async function setupListener() {
    if (typeof browser === 'undefined') {
        // eslint-disable-next-line
        var browser = chrome;
    }

    browser.runtime.onMessage.addListener((request) => {
        const theme = request.theme;
        setTheme(theme);
    });

    try {
        const theme = await browser.runtime.sendMessage({ type: "QUERY_THEME" });
        await setTheme(theme);
        observeHeadChanges();
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
    }
}

function observeHeadChanges() {
    const target = document.head;

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(item => {
                    if (item instanceof HTMLStyleElement && !item.classList.contains(CLASS_PREFIX)) {
                        injectDynamicTheme(item);
                    } else if (item instanceof HTMLLinkElement &&
                        !item.classList.contains(CLASS_PREFIX) &&
                        /stylesheet/i.test(item.rel)) {
                        injectDynamicTheme(item);
                    }
                });
            }
        }
    });

    observer.observe(target, { childList: true, subtree: false });
}
