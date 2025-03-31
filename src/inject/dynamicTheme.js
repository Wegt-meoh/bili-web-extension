async function setupListener() {
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
            document.documentElement.classList.remove('dark-bili');
            break;
        default:
            document.documentElement.classList.add('dark-bili');
            break;
    }
    await saveConfig(theme);
}

const STYLE_SELECTOR = "style, link[rel*='stylesheet' i]:not([disabled])";

function isFontsGoogleApiStyle(element) {
    if (typeof element.href !== "string") {
        return false;
    }

    try {
        const elementURL = new URL(element.href);
        return elementURL.hostname === 'fonts.googleapis.com';
    } catch (err) {
        console.error(err);
        return false;
    }
}

function shouldManageStyle(element) {
    if (!(element instanceof HTMLElement)) {
        console.log("element not instanceof HTMLElement return false");
        return false;
    }

    return (
        (element instanceof HTMLStyleElement) ||
        (element instanceof SVGStyleElement) ||
        (element instanceof HTMLLinkElement &&
            Boolean(element.rel) &&
            element.rel.toLowerCase().includes("stylesheet") &&
            Boolean(element.href) &&
            !element.disabled &&
            (navigator.userAgent.toLowerCase().includes("firefox") ?
                !element.href.startsWith("moz-extension://") : true
            ) &&
            !isFontsGoogleApiStyle(element)
        )
    ) &&
        !element.classList.contains("dark-bili") &&
        element.media.toLowerCase() !== "print" &&
        !element.classList.contains("stylus");
}

function getStyles(element, result = []) {
    console.log("get styles on ", element);

    if (!(element instanceof Element || element instanceof Document)) {
        console.log("not instanceof Element so return empty array");
        return result;
    }

    if (shouldManageStyle(element)) {
        console.log("element should manage style push it to result");
        result.push(element);
    } else {
        console.log("element should not manage style,query it");
        element.querySelectorAll(STYLE_SELECTOR).forEach(item => {
            getStyles(item, result);
        });
    }

    return result;
}

export async function injectDynamicTheme() {
    //    await setupListener();
    const allStyles = getStyles(document);
    console.log("this is allstyles");
    allStyles.forEach(s => {
        console.log(s.textContent ?? "");
    });
}
