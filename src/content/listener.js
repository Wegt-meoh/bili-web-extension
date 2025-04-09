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
        observeRootChanges(() => {
            setTheme(theme);
        });
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

function observeRootChanges(callback) {
    const target = document.documentElement;

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                let flag = false;
                mutation.addedNodes.forEach(item => {
                    if (item instanceof HTMLStyleElement && !item.classList.contains(CLASS_PREFIX)) {
                        flag = true;
                    } else if (item instanceof HTMLLinkElement &&
                        !item.classList.contains(CLASS_PREFIX) &&
                        /stylesheet/i.test(item.rel)) {
                        flag = true;
                    }
                });
                if (flag) {
                    callback(mutation.addedNodes);
                }
            }
        }
    });

    observer.observe(target, { childList: true, subtree: false });
}

