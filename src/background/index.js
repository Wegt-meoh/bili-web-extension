if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}
const PLUGIN_KEY = "dark-bili";

async function loadConfig() {
    const config = await browser.storage.local.get(PLUGIN_KEY);
    if (!config[PLUGIN_KEY]?.theme) {
        await browser.storage.local.set({ [PLUGIN_KEY]: { theme: "light" } });
        return "light";
    } else {
        return config[PLUGIN_KEY].theme;
    }
}

async function saveConfig(theme) {
    await browser.storage.local.set({ [PLUGIN_KEY]: { theme } });
}

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
        loadConfig().then(theme => {
            sendResponse(theme);
        });
        return true;
    }

    if (message.type === "APPLY_THEME") {
        setTabTheme(message.theme);
        saveConfig(message.theme);
        return true;
    }
});
