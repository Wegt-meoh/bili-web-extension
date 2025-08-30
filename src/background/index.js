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

browser.runtime.onMessage.addListener((message, _, sendResponse) => {
    switch (message.type) {
        case MessageType.QUERY_THEME: {
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
            break;
        }
        case MessageType.APPLY_THEME: {
            if (!themeOptions.includes(message.theme)) {
                message.theme = "light";
            }
            getActiveTab().then(tab => {
                const hostname = extractHostnameByUrl(tab.url);
                const key = getKey(hostname, "theme");
                browser.tabs.sendMessage(tab.id, { type: MessageType.APPLY_THEME, theme: message.theme }).then(() => {
                    localStorage.set({ [key]: message.theme });
                }).catch(() => { });
            }).catch((reason) => {
                console.error("getActiveTab error reason:", reason);
            });
            break;
        }
        case MessageType.FETCH: {
            const { url, origin } = message;
            loadAsText(url, origin).then(text => {
                sendResponse(text);
            }).catch(err => {
                Logger.err("bg fetch failed", err);
                sendResponse("");
            });
            break;
        }
        default:
    }
    return true;
});

browser.tabs.onActivated.addListener((activeInfo) => {
    browser.tabs.sendMessage(activeInfo.tabId, { type: MessageType.ONACTIVE }).catch(() => { });
    return true;
});
