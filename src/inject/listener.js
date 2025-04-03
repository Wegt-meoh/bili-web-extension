import { CLASS_PREFIX } from "../inject/const";
import { injectDynamicTheme } from "../inject/dynamicTheme";

export async function setupListener() {
    if (typeof browser === 'undefined') {
        // eslint-disable-next-line
        var browser = chrome;
    }


    browser.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
        setTheme(request.theme);
    });


    // load default settings
    try {
        const theme = await loadConfig();
        setTheme(theme);
    } catch (err) {
        console.error(`load config failed: ${err}`);
    }
}

async function saveConfig(theme) {
    if (typeof browser === 'undefined') {
        // eslint-disable-next-line
        var browser = chrome;
    }
    try {
        await browser.storage.local.set({ theme });
    } catch (error) {
        console.error(error);
    }
}

async function loadConfig() {
    if (typeof browser === 'undefined') {
        // eslint-disable-next-line
        var browser = chrome;
    }
    try {
        let { theme } = await browser.storage.local.get('theme');
        if (typeof theme !== 'string') {
            await saveConfig('light');
            return 'light';
        }
        return theme;
    } catch (error) {
        console.error(error);
        return 'dark';
    }
}

async function setTheme(theme) {
    switch (theme) {
        case 'light':
            document.querySelector(`style.${CLASS_PREFIX}`)?.remove();
            break;
        default:
            injectDynamicTheme();
            break;
    }
    await saveConfig(theme);
}
