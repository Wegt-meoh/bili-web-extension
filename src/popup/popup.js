import { MessageType } from "../utils/message";

if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

function setTabTheme(theme) {
    browser.runtime.sendMessage({ type: MessageType.APPLY_THEME, theme }, () => {
        // Check for runtime errors
        if (browser.runtime.lastError) {
            // Example: Handle "Could not establish connection" or similar errors
            return;
        }
    });
}

async function getActiveTab() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
}

function extractHostnameByUrl(url) {
    return (new URL(url)).hostname;
}

(async function() {
    // add listener
    const switchButton = document.querySelector('.switch');

    if (!switchButton) return;

    // load config
    const activeTab = await getActiveTab();
    const theme = await browser.runtime.sendMessage({
        type: MessageType.QUERY_THEME, hostname: extractHostnameByUrl(activeTab.url)
    });
    switchButton.textContent = theme;
    switchButton.addEventListener('click', () => {
        switch (switchButton.textContent) {
            case "light":
                switchButton.textContent = "dark";
                break;
            case "dark":
                switchButton.textContent = "system";
                break;
            case "system":
                switchButton.textContent = "light";
                break;
            default:
                switchButton.textContent = "light";
        }
        setTabTheme(switchButton.textContent);
    });
})();
