if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

var localStorage = browser.storage.local;

async function getActiceTab() {
    return await browser.tabs.query({ url: ["https://*.bilibili.com/*"] });
}

async function setTabTheme(theme) {
    const tabs = await getActiceTab();
    await Promise.all(tabs.map(tab => browser.tabs.sendMessage(tab.id, { theme })));
}

browser.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.type === "QUERY_THEME") {
        localStorage.get("theme").then(config => {
            const { theme } = config;
            if (["light", "dark", "system"].includes(theme)) {
                sendResponse(theme);
            } else {
                localStorage.set({ theme: "light" });
                sendResponse("light");
            }
        });
        return true;
    }

    if (message.type === "APPLY_THEME") {
        setTabTheme(message.theme);
        localStorage.set({ theme: message.theme });
        sendResponse("ok");
        return true;
    }

    if (message.type === "QUERY_CACHE") {
        localStorage.get(message.url).then(config => {
            const result = config[message.url];
            if (!result) {
                sendResponse(null);
                return;
            }

            const { data, timeStamp } = result;
            if ((Date.now() - timeStamp) >= 1000 * 3600 * 24) {
                sendResponse(null);
            } else {
                sendResponse(data);
            }
        });
        return true;
    }

    if (message.type === "SAVE_CACHE") {
        localStorage.set({ [message.url]: { data: message.data, timeStamp: Date.now() } });
        sendResponse("ok");
        return true;
    }
});
