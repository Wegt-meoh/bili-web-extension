if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

var localStorage = browser.storage.local;

function extractHostnameByUrl(url) {
    return (new URL(url)).hostname;
}

async function getActiveTab() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

async function getAllRelatedTabsWithActiveTab() {
    const activeTab = await getActiveTab();
    const hostname = extractHostnameByUrl(activeTab.url);
    const allTabs = await browser.tabs.query({});
    return allTabs.filter(tab => {
        if (!tab.url) return false;
        return extractHostnameByUrl(tab.url) === hostname;
    });
}

async function setTabTheme(theme) {
    const tabs = await getAllRelatedTabsWithActiveTab();
    await Promise.all(tabs.map(tab => browser.tabs.sendMessage(tab.id, { theme })));
}

function getKey(hostname, keyName) {
    return hostname + "_" + keyName;
}

browser.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.type === "QUERY_THEME") {
        const { hostname } = message;
        const key = getKey(hostname, "theme");

        localStorage.get(key).then(config => {
            const theme = config[key];
            if (["light", "dark", "system"].includes(theme)) {
                sendResponse(theme);
            } else {
                return Promise.reject();
            }
        }).catch(() => {
            localStorage.set({ [key]: "light" });
            sendResponse("light");
        });
        return true;
    }

    if (message.type === "APPLY_THEME") {
        getActiveTab().then(tab => {
            const hostname = extractHostnameByUrl(tab.url);
            const key = getKey(hostname, "theme");
            setTabTheme(message.theme);
            localStorage.set({ [key]: message.theme });
            sendResponse("ok");
        });
        return true;
    }
});
