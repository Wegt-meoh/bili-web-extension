import { extractHSL, extractRGB, extractRgbFromHex, hslToRgb, hslToString, invertHslColor, invertRgbColor, isDarkColor, rgbToHexText, rgbToText } from "./color.js";
import { CLASS_PREFIX, COLOR_KEYWORDS, IGNORE_SELECTOR, STYLE_SELECTOR } from "./const.js";
import { setupDomListener, setupStyleListener, setupThemeListener } from "./listener.js";
import { classNameToSelectorText, cssBlocksToText, cssDeclarationToText, parseCssStyleSheet, parseStyleAttribute } from "./utils.js";

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
        element.media.toLowerCase() !== "print" &&
        !element.classList.contains("stylus");
}

function traverseShadowRoot(target) {
    if (!(target instanceof Node)) {
        return;
    }

    if (target.shadowRoot) {
        setupDomListener(target.shadowRoot);
        return;
    }

    const walker = document.createTreeWalker(
        target,
        NodeFilter.SHOW_ELEMENT,
        { acceptNode: () => NodeFilter.FILTER_ACCEPT }
    );
    while ((walker.nextNode())) {
        if (walker.currentNode.shadowRoot) {
            setupDomListener(walker.currentNode.shadowRoot);
        }
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
        traverseShadowRoot(element);
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
                let element = prop === ":host" ? root.host : root.querySelector(prop.replaceAll(/:hover|:before|:after/gi, ""));
                if (element === null) {
                    element = root instanceof ShadowRoot ? root.host : root.documentElement;
                }
                const style = getComputedStyle(element);
                Reflect.set(target, prop, style, reciever);
                return style;
            } catch {
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
    });
    return modifiedRules;
}

export function generateModifiedRules(cssStyleRules, root) {
    const modifiedCssRules = [];
    const computedStyleMap = generateComputedMap(root);

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

async function getOriginalStyleData(element) {
    const result = await Promise.all(getStyles(element, []).map(async (s) => {
        const rules = getCssRules(s);
        if (rules !== null) {
            return { textContent: null, source: s };
        }

        let textContent = "";
        if (typeof s.textContent === "string" && s.textContent.length > 0) {
            textContent = s.textContent;
        } else if (typeof s.href === "string" && s.href.startsWith("http") && s.href.endsWith(".css")) {
            let count = 0;
            const fetchLatest = async () => {
                while (count <= 5) {
                    try {
                        count += 1;
                        const resp = await fetch(s.href);
                        return await resp.text();
                    } catch {
                        return new Promise((res) => {
                            setTimeout(() => {
                                res(fetchLatest());
                            }, 1000);
                        });
                    }
                }
                return null;
            };

            const useCache = async () => {
                return browser.runtime.sendMessage({ type: "QUERY_CACHE", url: s.href });
            };

            const saveCache = async (data) => {
                browser.runtime.sendMessage({ type: "SAVE_CACHE", url: s.href, data });
            };

            const cache = await useCache();
            if (cache) {
                textContent = cache;
            } else {
                textContent = await fetchLatest();
                await saveCache(textContent);
            }
            if (textContent === null) {
                return null;
            }
        } else {
            return null;
        }
        return { textContent, source: s };
    }));

    return result.filter(item => item !== null);
}

function getAllInlineStyleElements(element, result = []) {
    if (!(element instanceof Element)) {
        return result;
    }

    const style = element.getAttribute("style");
    if (typeof style === "string" && style.length > 0) {
        result.push(element);
    }

    element.querySelectorAll("[style]").forEach(e => result.push(e));
    return result;
}

export async function injectDynamicTheme(element) {
    if (!(element instanceof Node)) {
        return;
    }

    try {
        const inlineStyleElements = getAllInlineStyleElements(element);
        inlineStyleElements.forEach(el => handleInlineStyle(el));

        const styleDataList = await getOriginalStyleData(element);
        styleDataList.forEach(styleData => {
            if (styleData.source instanceof HTMLStyleElement) {
                setupStyleListener(styleData.source);
            }
            // ensure handle style data after observer setup
            handleStyleElementAndLinkElement(styleData);
        });
    } catch (err) {
        console.log("bili-web-extension: catch err", err);
    }
}

function handleInlineStyle(element) {
    if (!(element instanceof Element)) {
        return;
    }

    // ignore this cssrule when match
    if (checkShouldIgnore(classNameToSelectorText(element.className))) {
        return;
    }

    element.originalStyle = element.getAttribute("style");
    if (element.originalStyle === null) {
        return;
    }

    const cssRules = parseStyleAttribute(element.originalStyle);
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

    if (element.hasHandled === true) {
        return;
    }

    setupThemeListener(element, (theme) => {
        if (theme === "light") {
            element.setAttribute("style", element.originalStyle);
        } else {
            handleInlineStyle(element);
        }
    });
    element.hasHandled = true;
}

export function handleStyleElementAndLinkElement(styleData) {
    const { textContent, source } = styleData;

    if (!(source instanceof Node)) {
        console.error("styleData.source must be node but got", source);
        return;
    }

    const cssRules = parseCssStyleSheet(textContent === null ? source.textContent : textContent);
    const modifiedRules = generateModifiedRules(cssRules, source.getRootNode());

    if (!modifiedRules || modifiedRules.length === 0) {
        source.relatedStyle?.remove();
        source.relatedStyle = null;
        return;
    }

    const injectedStyleElem = generateStyleElement(modifiedRules);
    source.insertAdjacentElement('afterend', injectedStyleElem);
    source.relatedStyle = injectedStyleElem;
}
