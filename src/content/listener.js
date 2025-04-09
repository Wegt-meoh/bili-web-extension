import { CLASS_PREFIX } from "../content/const";
import { injectDynamicTheme } from "../content/core";

export async function setupListener() {
    if (typeof browser === 'undefined') {
        // eslint-disable-next-line
        var browser = chrome;
    }

    let theme;
    let timer = null;

    const [start, pause] = observeHeadChanges(() => {
        pause();
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(async () => {
            await setTheme(theme);
            start();
        }, 1000);
    });

    browser.runtime.onMessage.addListener((request) => {
        pause();
        theme = request.theme;
        setTheme(theme).then(() => {
            start();
        });
    });

    try {
        theme = await browser.runtime.sendMessage({ type: "QUERY_THEME" });
        await setTheme(theme);
        start();
    } catch (err) {
        console.error(err);
    }
}

async function setTheme(theme) {
    document.querySelectorAll(`style.${CLASS_PREFIX}`).forEach(item => item.remove());
    switch (theme) {
        case 'light':
            break;
        default:
            await injectDynamicTheme();
            break;
    }
}

function observeHeadChanges(callback) {
    const target = document.documentElement;

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                console.log("change");
                let flag = false;
                mutation.addedNodes.forEach(item => {
                    if (item instanceof HTMLStyleElement) {
                        flag = true;
                    } else if (item instanceof HTMLLinkElement && /stylesheet/i.test(item.rel)) {
                        flag = true;
                    }
                });
                if (flag) {
                    callback(mutation.addedNodes);
                }
            }
        }
    });


    const pause = () => {
        observer.disconnect();
    };

    const start = () => {
        observer.observe(target, { childList: true, subtree: false });

    };
    return [start, pause];
}

