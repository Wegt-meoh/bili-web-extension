import { extractHSL, extractRGB, extractRgbFromHex, hslToString, invertHslColor, invertRgbColor, isDarkColor, rgbToHexText, rgbToText } from "./color.js";
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
            setupDomListener(walker.currentNode);
        }
    }
}

function getStyles(element, result = []) {
    if (!isInstanceOf(element, Element) && !isInstanceOf(element, ShadowRoot)) {
        return result;
    }

    if (shouldManageStyle(element)) {
        result.push(element);
    } else {
        element.querySelectorAll(STYLE_SELECTOR).forEach(item => {
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
    return /^(rgba?\(|hsla?\(|#)/i.test(color);

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

function handleRgbColor(prop, color) {
    const [r, g, b, a] = extractRGB(color);
    if ((isDarkColor(r, g, b) && /^background.*/i.test(prop)) || (!isDarkColor(r, g, b) && /^color/i.test(prop))) {
        return color;
    }
    return rgbToText(...invertRgbColor(r, g, b, a));
}

function handleHexColor(prop, color) {
    const [r, g, b, a] = extractRgbFromHex(color);
    if ((isDarkColor(r, g, b) && /^background.*/i.test(prop)) || (!isDarkColor(r, g, b) && /^color/i.test(prop))) {
        return color;
    }
    return rgbToHexText(...invertRgbColor(r, g, b, a));
}

function handleHslColor(prop, color) {
    const [h, s, l, a] = extractHSL(color);
    if ((l < 0.5 && /background.*/.test(prop)) || (l >= 0.5 && /color/.test(prop))) {
        return color;
    }
    return hslToString(...invertHslColor(h, s, l, a));
}

function addCssPrefix(propType, variable) {
    return `--${CLASS_PREFIX}-${propType}${variable}`;
}

function handleVar(prop, variable, rootComputedStyle) {
    if (!isOtherColorCssVar(variable, rootComputedStyle)) {
        return variable;
    }

    const propType = getCssPropType(prop);

    if (propType === "") {
        return variable;
    }

    return addCssPrefix(propType, variable);
}

function getNewValue(prop, value, rootComputedStyle) {
    let newValue = value.replaceAll(/\brgba?\([\d. ,]+\)/g, color => handleRgbColor(prop, color));
    newValue = newValue.replaceAll(/\bhsla?\([\d. ,]+\)/g, color => handleHslColor(prop, color));
    newValue = newValue.replaceAll(/#[\da-fA-F]{3,8}/g, color => handleHexColor(prop, color));
    newValue = newValue.replaceAll(/--[\w]+[\w\d-]*/g, variable => handleVar(prop, variable, rootComputedStyle));
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

function generateModifiedRules(originalStyleElement, rootComputedStyle) {
    if (!originalStyleElement.sheet) {
        return null;
    }

    const { cssRules } = originalStyleElement.sheet;
    const modifiedCssRules = [];
    for (let i = 0; i < cssRules.length; i += 1) {
        if (!isInstanceOf(cssRules[i], CSSStyleRule)) {
            continue;
        }

        const cssRule = cssRules[i];
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
            if (/^--[\w]+[\w\d-]*/.test(prop) && isOtherColorCssVar(prop, rootComputedStyle)) {
                const relatedProp = ["background", "border", "color"];
                relatedProp.forEach((cssProp) => {
                    const newPropName = addCssPrefix(getCssPropType(cssProp), prop);
                    const newValue = getNewValue(cssProp, value, rootComputedStyle);
                    modifiedRules.push({ prop: newPropName, value: newValue });
                });
                continue;
            }

            // handle the reference of css variable 
            let newValue = getNewValue(prop, value, rootComputedStyle);

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

function generateStyleElement(modifiedCssRules) {
    const injectedStyleElem = document.createElement("style");
    injectedStyleElem.classList.add(CLASS_PREFIX);
    injectedStyleElem.type = "text/css";
    let textContent = "";

    modifiedCssRules.forEach(cssRule => {
        textContent += cssRule.selectorText + "{\n";
        cssRule.rules.forEach(rule => {
            const { prop, value } = rule;
            textContent += `${prop}: ${value}; \n`;
        });
        textContent += "}\n";
    });
    injectedStyleElem.textContent = textContent;

    return injectedStyleElem;
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
    if (!isInstanceOf(element, Element) && !isInstanceOf(element, ShadowRoot)) {
        return;
    }
    const originalStyleElemList = await getOriginalStyleElement(element);
    if (originalStyleElemList.length === 0) {
        return;
    }
    const rootComputedStyle = getComputedStyle(element instanceof ShadowRoot ? element.host : element);
    originalStyleElemList.forEach(style => {
        handleStyleElem(style, rootComputedStyle);
        if (style.classList.contains(`${CLASS_PREFIX} -cors`)) {
            style.remove();
        } else {
            setupStyleListener(style, rootComputedStyle);
        }
    });
}

export function handleStyleElem(styleElem, rootComputedStyle) {
    if (!isInstanceOf(styleElem, HTMLStyleElement)) {
        throw new TypeError("styleElem must be HTMLStyleElement but got", styleElem);
    }

    if (!isInstanceOf(rootComputedStyle, CSSStyleDeclaration)) {
        throw new TypeError("rootComputedStyle must be CSSStyleDeclaration but got", rootComputedStyle);
    }

    const modifiedCssRules = generateModifiedRules(styleElem, rootComputedStyle);
    if (!modifiedCssRules || modifiedCssRules.length === 0) {
        styleElem.relatedStyle = null;
    }

    const injectStyleElem = generateStyleElement(modifiedCssRules);
    styleElem.insertAdjacentElement('afterend', injectStyleElem);
    styleElem.relatedStyle = injectStyleElem;
}
