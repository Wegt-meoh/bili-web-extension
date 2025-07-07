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
            const result = config.urlCache?.[message.url];
            if (!result) {
                sendResponse(null);
            } else if ((result.timeStamp - Date.now()) > 1000 * 60 * 60 * 24) {
                sendResponse(null);
            } else {
                sendResponse(result.data);
            }
        });
        return true;
    }

    if (message.type === "SAVE_CACHE") {
        localStorage.set({ urlCache: { [message.url]: { data: message.data, timeStamp: Date.now() } } });
        return true;
    }
});
