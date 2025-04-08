import { CLASS_PREFIX } from "../inject/const";
import { injectDynamicTheme } from "../inject/dynamicTheme";

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
    const head = document.head;

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                callback(mutation.addedNodes);
            }
        }
    });


    const pause = () => {
        observer.disconnect();
    };

    const start = () => {
        observer.observe(head, { childList: true, subtree: false });
    };
    return [start, pause];
}

