import { extractHSL, extractRGB, extractRgbFromHex, hslToRgb, hslToString, invertHslColor, invertRgbColor, isDarkColor, rgbToHexText, rgbToText } from "./color.js";
import { CLASS_PREFIX, COLOR_KEYWORDS, IGNORE_SELECTOR, SHORT_HAND_PROP, STYLE_SELECTOR } from "./const.js";
import { setupDomListener, setupStyleListener } from "./listener.js";
import { isInstanceOf } from "./utils.js";

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
    if (!isInstanceOf(element, HTMLElement)) {
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
        !element.classList.toString().includes(CLASS_PREFIX) &&
        element.media.toLowerCase() !== "print" &&
        !element.classList.contains("stylus");
}

function traverseShadowRoot(target) {
    if (!target || !isInstanceOf(target, Node)) {
        throw new TypeError("target is not Node");
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
    if (shouldManageStyle(element)) {
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

function extractCssVarName(text) {
    if (typeof text !== "string") {
        throw new TypeError("text must be string but got ", typeof text);
    }

    const newText = text.slice(4, text.length - 1).trim();
    const index = newText.indexOf(",");
    if (index === -1) {
        return { varName: newText, fallback: undefined };
    }
    return { varName: newText.slice(0, index).trim(), fallback: newText.slice(index + 1).trim() };
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

function handleVar(prop, variable, rootComputedStyle) {
    const propType = getCssPropType(prop);

    if (propType === "" && !isOtherColorCssVar(variable, rootComputedStyle)) {
        return variable;
    }

    return addCssPrefix(propType, variable);
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

function getNewValue(prop, value, rootComputedStyle) {
    let newValue = value.replaceAll(/\brgba?\([\d. ,]+\)/g, color => handleRgbColor(prop, color));
    newValue = newValue.replaceAll(/\bhsla?\([\d. ,]+\)/g, color => handleHslColor(prop, color));
    newValue = newValue.replaceAll(/#[\da-fA-F]{3,8}/g, color => handleHexColor(prop, color));
    newValue = newValue.replaceAll(/--[\w_]+[\w\d-_]*/g, variable => handleVar(prop, variable, rootComputedStyle));
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

export function generateModifiedRules(cssRuleList, root) {
    if (!(cssRuleList instanceof CSSRuleList)) {
        return null;
    }

    const modifiedCssRules = [];
    const _computedStyleMap = {};
    const computedStyleMap = new Proxy(_computedStyleMap, {
        get(target, prop, reciever) {
            const value = Reflect.get(target, prop, reciever);
            if (value !== undefined) {
                return value;
            }

            if (root !== document && !(root instanceof ShadowRoot)) {
                throw new TypeError("root must be document or ShadowRoot");
            }

            const element = root.querySelector(prop);
            const style = element instanceof Element ? getComputedStyle(element) : { getPropertyValue() { return ""; } };
            Reflect.set(target, prop, style, reciever);
            return style;
        }
    });

    for (let i = 0; i < cssRuleList.length; i += 1) {
        const cssRule = cssRuleList[i];
        if (!(cssRule instanceof CSSStyleRule)) {
            continue;
        }

        const cssRuleStyle = cssRule.style;
        const cssRuleStylePropList = [...Array.from(cssRule.style), ...SHORT_HAND_PROP];
        const selectorText = cssRule.selectorText;
        const modifiedRules = [];

        // ignore this cssrule when match
        if (checkShouldIgnore(selectorText)) {
            continue;
        }

        for (const prop of cssRuleStylePropList) {
            const value = cssRuleStyle.getPropertyValue(prop).trim();
            const priority = cssRuleStyle.getPropertyPriority(prop);

            // handle the definition of css variable
            if (/^--[\w-_]+[\w\d-_]*/.test(prop) && isOtherColorCssVar(prop, computedStyleMap[selectorText])) {
                const relatedProp = ["background", "border", "color"];
                relatedProp.forEach((cssProp) => {
                    const newPropName = addCssPrefix(getCssPropType(cssProp), prop);
                    const newValue = getNewValue(cssProp, value, computedStyleMap[selectorText]);
                    modifiedRules.push({ prop: newPropName, value: newValue });
                });
                continue;
            }

            // handle the reference of css variable 
            let newValue = getNewValue(prop, value, computedStyleMap[selectorText]);

            if (value === newValue) {
                continue;
            }

            if (priority === "important") {
                newValue += "!important";
            }
            modifiedRules.push({ prop, value: newValue });
        }

        if (modifiedRules.length > 0) {
            modifiedCssRules.push({ selectorText: selectorText, rules: modifiedRules });
        }
    }

    return modifiedCssRules;
}

export function rulesToCssText(cssRules) {
    let text = "";
    cssRules.forEach(cssRule => {
        text += cssRule.selectorText + "{\n";
        cssRule.rules.forEach(rule => {
            const { prop, value } = rule;
            text += `${prop}: ${value}; \n`;
        });
        text += "}\n";
    });
    return text;
}

function generateStyleElement(cssRules) {
    const styleElement = document.createElement("style");
    styleElement.classList.add(CLASS_PREFIX);
    styleElement.type = "text/css";
    styleElement.textContent = rulesToCssText(cssRules);
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

async function getOriginalStyleElement(element) {
    const result = await Promise.all(getStyles(element, []).map(async (s) => {
        const rules = getCssRules(s);
        if (rules !== null) {
            return s;
        }

        let styleTextContent = "";
        const injectStyleElem = document.createElement("style");
        injectStyleElem.classList.add(`${CLASS_PREFIX}-cors`);
        if (typeof s.textContent !== "string" || s.textContent.length === 0) {
            const resp = await fetch(s.href);
            styleTextContent = await resp.text();
        } else {
            styleTextContent = s.textContent;
        }
        injectStyleElem.textContent = styleTextContent;

        s.insertAdjacentElement('afterend', injectStyleElem);
        return injectStyleElem;
    }));

    return result.filter(item => item);
}

export async function injectDynamicTheme(element) {
    if (!(element instanceof Node)) {
        return;
    }

    const originalStyleElemList = await getOriginalStyleElement(element);
    if (originalStyleElemList.length === 0) {
        return;
    }

    originalStyleElemList.forEach(style => {
        handleStyleElem(style, element.getRootNode());
        if (style.classList.contains(`${CLASS_PREFIX}-cors`)) {
            style.remove();
        } else {
            setupStyleListener(style, element.getRootNode());
        }
    });
}

export function handleStyleElem(styleElem, root) {
    if (!isInstanceOf(styleElem, HTMLStyleElement)) {
        console.error("styleElem must be HTMLStyleElement but got", styleElem);
        return;
    }

    const modifiedCssRules = generateModifiedRules(styleElem.sheet?.cssRules, root);
    if (!modifiedCssRules || modifiedCssRules.length === 0) {
        styleElem.relatedStyle = null;
    }

    const injectStyleElem = generateStyleElement(modifiedCssRules);
    styleElem.insertAdjacentElement('afterend', injectStyleElem);
    styleElem.relatedStyle = injectStyleElem;
}
