import { extractRGB, extractRgbFromHex, invertHslColor, rgbToHexText } from "./color.js";
import { CLASS_PREFIX, STYLE_SELECTOR, COLORFUL_PROPERTY } from "./const.js";

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
            document.querySelector(`style.${CLASS_PREFIX}`)?.remove();
            break;
        default:
            injectDynamicTheme();
            break;
    }
    await saveConfig(theme);
}



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
        !element.classList.contains(CLASS_PREFIX) &&
        element.media.toLowerCase() !== "print" &&
        !element.classList.contains("stylus");
}

function getStyles(element, result = []) {

    if (!(element instanceof Element || element instanceof Document)) {

        return result;
    }

    if (shouldManageStyle(element)) {
        result.push(element);
    } else {
        element.querySelectorAll(STYLE_SELECTOR).forEach(item => {
            getStyles(item, result);
        });
    }

    return result;
}

async function getColorCssVarSet() {
    const originalStyleElemList = await Promise.all(getStyles(document).map(async (s) => {
        let styleTextContent = "";
        const injectStyleElem = document.createElement("style");
        if (typeof s.textContent !== "string" || s.textContent.length === 0) {
            const resp = await fetch(s.href);
            styleTextContent = await resp.text();
        } else {
            styleTextContent = s.textContent;
        }
        injectStyleElem.textContent = styleTextContent;
        return injectStyleElem;
    }));

    document.head.append(...originalStyleElemList);

    const varSet = new Set();

    originalStyleElemList.forEach(style => {
        if (!style.sheet) {
            return;
        }

        const { cssRules } = style.sheet;

        for (let i = 0; i < cssRules.length; i += 1) {
            if (!(cssRules[i] instanceof CSSStyleRule)) {
                continue;
            }
            const cssStyleRule = cssRules[i];
            const cssStyleRuleStyle = cssStyleRule.style;
            let result = [];
            for (let key of COLORFUL_PROPERTY) {
                const value = cssStyleRuleStyle.getPropertyValue(key);
                if (value.length === 0 || value === "inherit") continue;
                result.push({ key, value });
            }
            if (result.length > 0) {
                // console.log(cssStyleRule.selectorText);
                //console.log(result);
                result.forEach(r => {
                    const colorVarList = getColorVar(r.value);
                    colorVarList.filter(item => item).forEach(item => {
                        varSet.add(item.varStr);
                    });
                });
            }
        }

        style.remove();
    });

    return varSet;
}

export async function injectDynamicTheme() {
    //await setupListener();
    const varSet = await getColorCssVarSet();

    const computedStyle = getComputedStyle(document.documentElement);
    const darkThemeStyleElem = document.createElement("style");
    darkThemeStyleElem.classList.add(CLASS_PREFIX);
    darkThemeStyleElem.type = "text/css";
    let cssContent = ":root{\n";
    for (const item of varSet) {
        const splitedVarValue = computedStyle.getPropertyValue(item).split(" ");
        const convertedVarValues = splitedVarValue.map((varValue) => {
            if (varValue.includes("rgb")) {
                return rgbToHexText(...invertHslColor(extractRGB(varValue)));
            } else if (varValue.includes("#")) {
                return rgbToHexText(...invertHslColor(...extractRgbFromHex(varValue)));
            } else {
                return varValue;
            }
        });

        cssContent += `${item}: ${convertedVarValues.join(" ")};\n`;
    }
    cssContent += "}";
    darkThemeStyleElem.textContent = cssContent;
    document.head.appendChild(darkThemeStyleElem);
}

function getColorVar(valueStr) {
    //    const rgbRegex = /rgba?\(.*\)/g;
    //    const rgbStrList = valueStr.matchAll(rgbRegex).map(item => item[0]);
    //    rgbStrList.forEach(item => {
    //        console.log(`rgb = ${ item } `);
    //    });
    const varRegex = /var\((--[\w-]+)\)/g;
    const varStrList = valueStr.matchAll(varRegex).map(item => item[1]);
    const computedStyle = getComputedStyle(document.documentElement);
    return varStrList?.map(varStr => {
        const varValue = computedStyle.getPropertyValue(varStr);
        if (/rgba?\(\w+\)/.test(varValue) || /#\w+/.test(varValue)) {
            return { varStr, varValue };
        }
    });
}

