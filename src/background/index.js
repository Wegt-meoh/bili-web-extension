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
});
