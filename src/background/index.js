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

function getKey(hostname, keyName) {
    return hostname + "_" + keyName;
}

const themeType = ["light", "dark", "system"];

browser.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.type === "QUERY_THEME") {
        const { hostname } = message;
        const key = getKey(hostname, "theme");

        localStorage.get(key).then(config => {
            const theme = config[key];
            if (theme.includes(theme)) {
                sendResponse(theme);
            } else {
                return Promise.reject();
            }
        }).catch(() => {
            localStorage.set({ [key]: "light" });
            sendResponse("light");
        });
    }

    if (message.type === "APPLY_THEME") {
        if (!themeType.includes(message.theme)) {
            message.theme = "light";
        }
        getActiveTab().then(tab => {
            const hostname = extractHostnameByUrl(tab.url);
            const key = getKey(hostname, "theme");
            browser.tabs.sendMessage(tab.id, { type: "APPLY_THEME", theme: message.theme }).then(() => {
                localStorage.set({ [key]: message.theme });
            }).catch(() => { });
        }).catch((reason) => {
            console.error("getActiveTab error reason:", reason);
        });
    }

    return true;
});

browser.tabs.onActivated.addListener((activeInfo) => {
    browser.tabs.sendMessage(activeInfo.tabId, { type: "ONACTIVE" }).catch(() => { });
    return true;
});
