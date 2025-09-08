import { loadAsText } from "../content/network";
import { Logger } from "../content/utils";
import { MessageType } from "../utils/message";

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

const themeOptions = ["light", "dark", "system"];

async function handleOnMessage(message, sendResponse) {
    switch (message.type) {
        case MessageType.QUERY_THEME: {
            const { hostname } = message;
            const key = getKey(hostname, "theme");
            try {
                const config = await localStorage.get(key);
                const theme = config[key];
                if (theme.includes(theme)) {
                    sendResponse(theme);
                } else {
                    throw new Error("theme not available");
                }
            } catch (err) {
                localStorage.set({ [key]: "light" });
                sendResponse("light");
                Logger.err(err);
            }
            break;
        }
        case MessageType.APPLY_THEME: {
            if (!themeOptions.includes(message.theme)) {
                message.theme = "light";
            }
            try {
                const tab = await getActiveTab();
                const hostname = extractHostnameByUrl(tab.url);
                const key = getKey(hostname, "theme");
                await browser.tabs.sendMessage(tab.id, { type: MessageType.APPLY_THEME, theme: message.theme });
                localStorage.set({ [key]: message.theme });
            } catch (reason) {
                Logger.err("getActiveTab error reason:", reason);
            }
            break;
        }
        case MessageType.FETCH: {
            try {
                const { url, origin } = message;
                const text = await loadAsText(url, origin);
                sendResponse(text);
            } catch (err) {
                Logger.err("bg fetch failed", err);
                sendResponse("");
            }
            break;
        }
        default:
            sendResponse("unknown MessageType", message.type);
            Logger.err("unknown MessageType", message.type);
    }
}

browser.runtime.onMessage.addListener((message, _, sendResponse) => {
    handleOnMessage(message, sendResponse);
    return true;
});

browser.tabs.onActivated.addListener((activeInfo) => {
    browser.tabs.sendMessage(activeInfo.tabId, { type: MessageType.ONACTIVE }).catch(() => { });
    return true;
});
