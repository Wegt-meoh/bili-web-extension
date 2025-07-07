if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

var localStorage = browser.storage.local;

async function getActiceTab() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length <= 0) return;

    const activeTabId = tabs[0].id;
    return activeTabId;
}

async function setTabTheme(theme) {
    const activeTabId = await getActiceTab();
    await browser.tabs.sendMessage(activeTabId, { theme });
}

browser.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.type === "QUERY_THEME") {
        localStorage.get().then(config => {
            if (!config) {
                localStorage.set({ theme: "light" });
                sendResponse("light");
            } else {
                sendResponse(config.theme);
            }
        });
        return true;
    }

    if (message.type === "APPLY_THEME") {
        setTabTheme(message.theme);
        localStorage.set({ theme: message.theme });
        return true;
    }

    if (message.type === "QUERY_CACHE") {
        localStorage.get().then(config => {
            const url = config[message.url];
            if (!url) {
                sendResponse(null);
            } else {
                sendResponse(url);
            }
        });
        return true;
    }

    if (message.type === "SAVE_CACHE") {
        localStorage.set({ [message.url]: message.data });
        return true;
    }
});
