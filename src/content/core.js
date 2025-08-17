import { extractHSL, extractRGB, extractRgbFromHex, hslToRgb, hslToString, invertHslColor, invertRgbColor, isDarkColor, rgbToHexText, rgbToText } from "./color.js";
import { CLASS_PREFIX, COLOR_KEYWORDS, IGNORE_SELECTOR, PSEUDO_ELEMENT, STYLE_SELECTOR } from "./const.js";
import { classNameToSelectorText, cssBlocksToText, cssDeclarationToText, getStyleSheetText, Logger, parseCssStyleSheet, parseStyleAttribute } from "./utils.js";

if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

function isFontsGoogleApiStyle(element) {
    if (typeof element.href !== "string") {
        return false;
    }

    try {
        const elementURL = new URL(element.href);
        return elementURL.hostname === 'fonts.googleapis.com';
    } catch (err) {
        Logger.err(err);
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
        element.media.toLowerCase() !== "print" &&
        !element.classList.contains("stylus");
}

async function injectInDeep(target) {
    if (!(target instanceof Node)) {
        return;
    }

    const deliver = (t) => {
        if (t.shadowRoot instanceof ShadowRoot) {
            setupDynamicDarkThemeForShadowRoot(t.shadowRoot);
            return true;
        }

        if (t instanceof HTMLFrameElement) {
            setupDynamicDarkTheme(t.contentDocument);
            return true;
        }

        return false;
    };

    if (deliver(target)) {
        return;
    }

    const walker = document.createTreeWalker(
        target,
        NodeFilter.SHOW_ELEMENT,
        { acceptNode: () => NodeFilter.FILTER_ACCEPT }
    );

    while ((walker.nextNode())) {
        deliver(walker.currentNode);
    }
}

function getStyles(element, result = []) {
    if (!(element instanceof Element) && !(element instanceof ShadowRoot)) {
        return result;
    }
    if (shouldManageStyle(element) && element.matches(STYLE_SELECTOR)) {
        result.push(element);
    } else {
        element?.querySelectorAll(STYLE_SELECTOR)?.forEach(item => {
            result.push(item);
        });
    }

    return result;
}

function isKeyWordColor(color) {
    if (typeof color !== "string") {
        throw new TypeError("color should be string");
    }
    return COLOR_KEYWORDS.has(color.toLowerCase());
}

function isOtherColor(color) {
    if (typeof color !== "string") {
        throw new TypeError("color should be string");
    }
    return /^(rgba?\(|hsla?\(|#|\d+,\d+,\d+)/i.test(color);

}

function isOtherColorCssVar(variable, rootComputedStyle) {
    return isOtherColor(rootComputedStyle.getPropertyValue(variable).trim());
}

function getCssPropType(prop) {
    return /^background|^(?!--).*-shadow$/i.test(prop) ? "bg" : /^border|^outline|^column-rule|^stroke$/i.test(prop) ? "border" : /^(color|text-decoration-color|caret-color|fill)$/i.test(prop) ? "text" : "";
}

function shouldInvertColor(propType, r, g, b) {
    if (propType === "") {
        return false;
    }
    const isDarkColorResult = isDarkColor(r, g, b);
    if ((isDarkColorResult && (propType === "bg" || propType === "border")) || (!isDarkColorResult && propType === "text")) {
        return false;
    }
    return true;
}

function handleRgbColor(prop, color) {
    const [r, g, b, a] = extractRGB(color);
    const propType = getCssPropType(prop);
    if (!shouldInvertColor(propType, r, g, b)) {
        return color;
    }
    return rgbToText(...invertRgbColor(r, g, b, a));
}

function handleHexColor(prop, color) {
    const [r, g, b, a] = extractRgbFromHex(color);
    const propType = getCssPropType(prop);
    if (!shouldInvertColor(propType, r, g, b)) {
        return color;
    }
    return rgbToHexText(...invertRgbColor(r, g, b, a));
}

function handleHslColor(prop, color) {
    const [h, s, l, a] = extractHSL(color);
    const [r, g, b] = hslToRgb(h, s, l);
    const propType = getCssPropType(prop);
    if (!shouldInvertColor(propType, r, g, b)) {
        return color;
    }
    return hslToString(...invertHslColor(h, s, l, a));
}

export function addCssPrefix(propType, variable) {
    return `--${CLASS_PREFIX}-${propType}${variable}`;
}

function handleVar(prop, variable, computedStyleMap, selectorText) {
    const propType = getCssPropType(prop);
    if (propType !== "" && isOtherColorCssVar(variable, computedStyleMap[selectorText])) {
        return addCssPrefix(propType, variable);
    }
    return variable;
}

function handleDirectRgb(prop, rgb) {
    let [r, g, b] = rgb.matchAll(/\d+/g);
    r = parseInt(r);
    g = parseInt(g);
    b = parseInt(b);

    const propType = getCssPropType(prop);
    if (!shouldInvertColor(propType, r, g, b)) {
        return rgb;
    }

    const [i_r, i_g, i_b] = invertRgbColor(r, g, b);
    return `${i_r},${i_g},${i_b}`;
}

function getNewValue(prop, value, computedStyleMap, selectorText) {
    let newValue = value.replaceAll(/\brgba?\([\d. ,]+\)/g, color => handleRgbColor(prop, color));
    newValue = newValue.replaceAll(/\bhsla?\([\d. ,]+\)/g, color => handleHslColor(prop, color));
    newValue = newValue.replaceAll(/#[\da-fA-F]{3,8}/g, color => handleHexColor(prop, color));
    newValue = newValue.replaceAll(/--[\w_]+[\w\d-_]*/g, variable => handleVar(prop, variable, computedStyleMap, selectorText));
    newValue = newValue.replaceAll(/^\d+,\d+,\d+/g, rgb => handleDirectRgb(prop, rgb));
    return newValue;
}

function checkShouldIgnore(selectorText) {
    const selectorList = selectorText.split(",").map(item => item.trim());
    for (const selector of selectorList) {
        if (IGNORE_SELECTOR.some(item => item === selector ? true : undefined)) {
            return true;
        }
    }
    return false;
}

function generateComputedMap(root) {
    const _computedStyleMap = {};
    const computedStyleMap = new Proxy(_computedStyleMap, {
        get(target, prop, reciever) {
            const value = Reflect.get(target, prop, reciever);
            if (value !== undefined) {
                return value;
            }
            const fallback = { getPropertyValue() { return ""; } };
            try {
                let element = prop === ":host" ? root.host : root.querySelector(prop.replaceAll(/:hover/gi, "").replaceAll(PSEUDO_ELEMENT, ""));
                if (element === null) {
                    element = root instanceof ShadowRoot ? root.host : root.documentElement;
                }
                const style = getComputedStyle(element);
                Reflect.set(target, prop, style, reciever);
                return style;
            } catch (error) {
                Logger.log(error);
                return fallback;
            }
        }
    });
    return computedStyleMap;
}

function handleRules(rules, computedStyle, computedStyleMap, selectorText) {
    if (computedStyle) {
        selectorText = "self";
        computedStyleMap = { self: computedStyle };
    }
    const modifiedRules = [];
    rules.forEach(rule => {
        try {
            const { prop, value, important } = rule;
            // handle the definition of css variable
            if (/^--[\w-_]+[\w\d-_]*/.test(prop) && isOtherColorCssVar(prop, computedStyleMap[selectorText])) {
                const relatedProp = ["background", "border", "color"];
                relatedProp.forEach((cssProp) => {
                    const newPropName = addCssPrefix(getCssPropType(cssProp), prop);
                    const newValue = getNewValue(cssProp, value, computedStyleMap, selectorText);
                    modifiedRules.push({ prop: newPropName, value: newValue });
                });
                return;
            }

            // handle the reference of css variable 
            let newValue = getNewValue(prop, value, computedStyleMap, selectorText);

            if (value === newValue) {
                return;
            }

            if (important) {
                newValue += "!important";
            }
            modifiedRules.push({ prop, value: newValue });
        } catch (error) {
            Logger.log(error);
        }
    });
    return modifiedRules;
}

export function generateModifiedRules(cssStyleRules, rootNode) {
    const modifiedCssRules = [];
    const computedStyleMap = generateComputedMap(rootNode);

    cssStyleRules.forEach(cssStyleRule => {
        const { rules, selectorText } = cssStyleRule;

        // ignore this cssrule when match
        if (checkShouldIgnore(selectorText)) {
            return;
        }

        const modifiedRules = handleRules(rules, null, computedStyleMap, selectorText);

        if (modifiedRules.length > 0) {
            modifiedCssRules.push({ selectorText: selectorText, rules: modifiedRules });
        }
    });

    return modifiedCssRules;
}



function generateStyleElement(cssRules) {
    const styleElement = document.createElement("style");
    styleElement.classList.add(CLASS_PREFIX);
    styleElement.type = "text/css";
    styleElement.textContent = cssBlocksToText(cssRules);
    return styleElement;
}

function getCssRules(style) {
    try {
        const rules = style.sheet?.cssRules;
        if (rules) {
            return rules;
        }
        return null;
    } catch {
        return null;
    }
}

async function getHtmlLinkElementData(linkElement) {
    if (!(linkElement instanceof HTMLLinkElement)) {
        Logger.err("element must be HTMLLinkElement but got ", linkElement);
        return "";
    }

    const fetchLatest = async (href) => {
        let count = 0;
        while (count <= 5) {
            try {
                count += 1;
                const resp = await fetch(href);
                return await resp.text();
            } catch (error) {
                Logger.log(error);
                return new Promise((res) => {
                    setTimeout(() => {
                        res(fetchLatest());
                    }, 2000);
                });
            }
        }
        return "";
    };

    if (linkElement instanceof HTMLLinkElement && typeof linkElement.href === "string" && linkElement.href.length > 0) {
        return fetchLatest(linkElement.href);
    }
    return "";
}

function getAllInlineStyleElements(element, result = []) {
    if (!(element instanceof Element) && !(element instanceof ShadowRoot)) {
        return result;
    }

    if (element instanceof Element) {
        const style = element.getAttribute("style");
        if (typeof style === "string" && style.length > 0) {
            result.push(element);
        }
    }

    element.querySelectorAll("[style]").forEach(e => result.push(e));
    return result;
}

async function injectDynamicTheme(target) {
    if (!(target instanceof Node)) {
        return;
    }

    // handle inline style elements
    const inlineStyleElements = getAllInlineStyleElements(target);
    inlineStyleElements.forEach(el => handleInlineStyle(el));

    // handle style element and css external link
    await Promise.all(
        getStyles(target).map(styleElement => {
            if (styleElement instanceof HTMLStyleElement) {
                observeStyleElement(styleElement);
            }

            if (styleElement instanceof HTMLLinkElement) {
                observeLinkElement(styleElement);
            }

            // ensure handle style data after observer setup
            return createOrUpdateStyleElement(styleElement);
        })
    );

    injectInDeep(target);
}

const originalInlineStyle = new Map();

function handleInlineStyle(element) {
    if (!(element instanceof Element)) {
        return;
    }

    // ignore the element which match the cssrule
    if (checkShouldIgnore(classNameToSelectorText(element.className))) {
        return;
    }

    if (!originalInlineStyle.has(element)) {
        originalInlineStyle.set(element, element.getAttribute("style"));
    }

    const cssRules = parseStyleAttribute(originalInlineStyle.get(element));
    const modifiedRules = handleRules(cssRules, getComputedStyle(element));

    if (modifiedRules.length === 0) {
        return;
    }

    const modifiedStyle = modifiedRules.reduce((prev, curr) => {
        prev.forEach(p => {
            if (p.prop === curr.prop) {
                p.value = curr.value;
                p.important = curr.important;
            }
        });
        return prev;
    }, [...cssRules]);

    element.setAttribute("style", cssDeclarationToText(modifiedStyle));
}

async function createOrUpdateStyleElement(cssElement) {
    if (!(cssElement instanceof HTMLStyleElement) && !(cssElement instanceof HTMLLinkElement) && !(cssElement instanceof SVGStyleElement)) {
        Logger.err("cssElement must be HTMLStyleElement or HTMLLinkElment or SVGStyleElement but got", cssElement);
        return;
    }

    const cssRules = parseCssStyleSheet(cssElement instanceof HTMLLinkElement ? await getHtmlLinkElementData(cssElement) : cssElement.textContent);
    const modifiedRules = generateModifiedRules(cssRules, cssElement.getRootNode());

    if (!modifiedRules || modifiedRules.length === 0) {
        if (cssElement._relatedStyle instanceof HTMLStyleElement) {
            cssElement._relatedStyle.textContent = "";
        }
        return;
    }

    const injectedStyleElem = generateStyleElement(modifiedRules);
    cssElement.insertAdjacentElement('afterend', injectedStyleElem);
    cssElement._relatedStyle = injectedStyleElem;
}

function handleAdoptedStyle(docum) {
    if (!(docum instanceof ShadowRoot) && !(docum instanceof Document)) {
        return;
    }

    const styleSheetList = docum.adoptedStyleSheets.filter(s => s._tag !== CLASS_PREFIX);
    const modifiedRulesList = styleSheetList
        .map(sheet => generateModifiedRules(parseCssStyleSheet(getStyleSheetText(sheet)), docum))
        .filter(i => i !== null);
    const injectedCssStyleSheetList = modifiedRulesList.map(rules => {
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(cssBlocksToText(rules));
        styleSheet._tag = CLASS_PREFIX;
        return styleSheet;
    });
    docum.adoptedStyleSheets.push(...injectedCssStyleSheetList);
}


export function setupDynamicDarkTheme(docum) {
    if (!(docum instanceof Document)) {
        return;
    }

    if (observedRoots.has(document.documentElement)) {
        return;
    }

    observedRoots.add(document.documentElement);

    try {
        handleAdoptedStyle(docum);
        observe(docum.documentElement);
        injectDynamicTheme(docum.documentElement);
    } catch (err) {
        Logger.log(err);
    }
}

function setupDynamicDarkThemeForShadowRoot(shadowRoot) {
    if (!(shadowRoot instanceof ShadowRoot)) {
        return;
    }

    if (observedRoots.has(shadowRoot)) {
        return;
    }

    observedRoots.add(shadowRoot);

    try {
        handleAdoptedStyle(shadowRoot);
        observe(shadowRoot);
        injectDynamicTheme(shadowRoot);
    } catch (err) {
        Logger.log(err);
    }
}

const observedStyleElement = new Set();

function observeLinkElement(linkElement) {
    if (!(linkElement instanceof HTMLLinkElement)) {
        Logger.err("element must be HTMLLinkElement but got", linkElement);
        return;
    }

    if (observedStyleElement.has(linkElement)) {
        return;
    }

    observedStyleElement.add(linkElement);

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "attributes" && mutation.attributeName === "href") {
                createOrUpdateStyleElement(linkElement);
            }
        }
        createOrUpdateStyleElement(linkElement);
    });
    observer.observe(linkElement, { attributes: true });
    observers.push(observer);
}

function observeStyleElement(styleElement) {
    if (!(styleElement instanceof HTMLStyleElement)) {
        Logger.err("styleElement must be HTMLStyleElement but got", styleElement);
        return;
    }

    if (observedStyleElement.has(styleElement)) {
        return;
    }

    observedStyleElement.add(styleElement);

    const observer = new MutationObserver((mutations) => {
        for (const { type } of mutations) {
            if (type === "childList" || type === "characterData") {
                createOrUpdateStyleElement(styleElement);
            }
        }
    });
    observer.observe(styleElement, { childList: true, subtree: true, characterData: true });
    observers.push(observer);
}

const observedRoots = new Set();
const observers = [];

function observe(target) {
    const observer = new MutationObserver((mutations,) => {
        for (let { type, addedNodes } of mutations) {
            if (type === "childList") {
                for (let addedNode of addedNodes) {
                    const { classList } = addedNode;
                    if (classList instanceof DOMTokenList && classList.contains(CLASS_PREFIX)) {
                        continue;
                    }
                    injectDynamicTheme(addedNode);
                }
            }
        }
    });

    observer.observe(target, { childList: true, subtree: true });
    observers.push(observer);
}

export function addSystemThemeListener(callback) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener("change", callback);
    return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener("change", callback);
}

export function cleanInjectedDarkTheme() {
    observedRoots.forEach(root => {
        if (!(root instanceof ShadowRoot)) {
            root = root.getRootNode();
        }

        // clean all injected style element
        root.querySelectorAll("." + CLASS_PREFIX).forEach(e => e.remove());

        // clean all inserted adopted styleSheet
        root.adoptedStyleSheets.forEach(s => s.cssRules);
        root.adoptedStyleSheets = root.adoptedStyleSheets.filter(s => s._tag !== CLASS_PREFIX);
    });
    observedRoots.clear();

    observers.forEach(o => {
        if (o instanceof MutationObserver) {
            o.disconnect();
        }
    });
    observers.splice(0, observers.length);

    observedStyleElement.clear();

    // clean all inline style
    originalInlineStyle.forEach((v, k) => {
        if (k instanceof Element) {
            k.setAttribute("style", v);
        }
    });
    originalInlineStyle.clear();
}
