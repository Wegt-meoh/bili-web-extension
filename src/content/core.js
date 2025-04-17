import { extractHSL, extractRGB, extractRgbFromHex, hslToString, invertHslColor, invertRgbColor, isDarkColor, rgbToHexText, rgbToText } from "./color.js";
import { CLASS_PREFIX, COLOR_KEYWORDS, IGNORE_SELECTOR } from "./const.js";
import { setupListener } from "./listener.js";

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
        !element.classList.contains(CLASS_PREFIX) &&
        element.media.toLowerCase() !== "print" &&
        !element.classList.contains("stylus");
}

function getStyles(element, result = []) {
    if (!isInstanceOf(element, Element) && !isInstanceOf(element, Document) && !isInstanceOf(element, ShadowRoot)) {
        return result;
    }

    if (shouldManageStyle(element)) {
        result.push(element);
    } else if (element.shadowRoot) {
        setupListener(element.shadowRoot);
    } else {
        for (const child of element.children) {
            getStyles(child, result);
        }
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

function invertColor(prop, color) {
    if (typeof color !== "string") {
        return color;
    }

    if (isKeyWordColor(color)) {
        return color;
    }

    if (/^rgba?\([\d., ]+\)/.test(color)) {
        const [r, g, b, a] = extractRGB(color);
        if ((isDarkColor(r, g, b) && /^background.*/i.test(prop)) || (!isDarkColor(r, g, b) && /^color/i.test(prop))) {
            return color;
        }
        return rgbToText(...invertRgbColor(r, g, b, a));
    } else if (color.startsWith("#")) {
        const [r, g, b, a] = extractRgbFromHex(color);
        if ((isDarkColor(r, g, b) && /^background.*/i.test(prop)) || (!isDarkColor(r, g, b) && /^color/i.test(prop))) {
            return color;
        }
        return rgbToHexText(...invertRgbColor(r, g, b, a));
    } else if (/^hsla?\([\d, .%]+\)/.test(color)) {
        const [h, s, l, a] = extractHSL(color);
        if ((l < 0.5 && /background.*/.test(prop)) || (l >= 0.5 && /color/.test(prop))) {
            return color;
        }
        return hslToString(...invertHslColor(h, s, l, a));
    } else if (color.startsWith("var")) {
        const matchResult = extractCssVarName(color);
        if (!matchResult) {
            return color;
        }

        const { varName, fallback } = matchResult;
        const propType = getCssPropType(prop);
        if (propType === "") {
            return color;
        }

        const newVarName = `--${CLASS_PREFIX}-${propType}${varName}`;
        return `var(${newVarName}${fallback ? `, ${invertColor(prop, fallback)}` : ""})`;
    } else {
        return color;
    }
};

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

        const cssStyleRule = cssRules[i];
        const cssStyleRuleStyle = cssStyleRule.style;
        const modifiedRules = [];

        const selectorList = cssStyleRule.selectorText.split(",").map(item => item.trim());
        let shouldIgnore = false;
        for (let i = 0; i < selectorList.length; i += 1) {
            if (IGNORE_SELECTOR.indexOf(selectorList[i]) !== -1) {
                shouldIgnore = true;
                break;
            }
        }
        if (shouldIgnore) {
            continue;
        }

        for (const prop of cssStyleRuleStyle) {
            let value = cssStyleRuleStyle.getPropertyValue(prop).trim();

            if (value === "") {
                if (/^background-.*/i.test(prop)) {
                    value = cssStyleRuleStyle.getPropertyValue("background");
                } else if (/^border-.*/i.test(prop)) {
                    value = cssStyleRuleStyle.getPropertyValue("border");
                } else {
                    continue;
                }
            }

            // handle the definition of css variable
            if (/^--[a-z\d-]+/i.test(prop) && isOtherColorCssVar(prop, rootComputedStyle)) {
                const propTypeList = ["bg", "border", "text"];
                const relatedProp = ["background", "border", "color"];
                propTypeList.forEach((propType, index) => {
                    const newPropName = `--${CLASS_PREFIX}-${propType}${prop}`;
                    modifiedRules.push({ prop: newPropName, newValue: invertColor(relatedProp[index], value) });
                });

                continue;
            }

            // handle the reference of css variable
            const newValue = value.replaceAll(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-f]{3,8}|var\(.*\)|\b[a-z-]+\b)/gi, color => invertColor(prop, color));
            if (value === newValue) {
                continue;
            }
            modifiedRules.push({ prop, newValue });
        }

        if (modifiedRules.length > 0) {
            modifiedCssRules.push({ selectorText: cssStyleRule.selectorText, rules: modifiedRules });
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
            const { prop, newValue } = rule;
            textContent += `${prop}: ${newValue};\n`;
        });
        textContent += "}\n";
    });
    injectedStyleElem.textContent = textContent;

    return injectedStyleElem;
}

function isInstanceOf(child, father) {
    return child instanceof father;
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
    if (!isInstanceOf(element, Element)) {
        return;
    }
    const originalStyleElemList = await getOriginalStyleElement(element);
    if (originalStyleElemList.length === 0) {
        return;
    }

    const rootComputedStyle = getComputedStyle(element);
    const injectedStyleElemList = originalStyleElemList.map(style => {
        const modifiedCssRules = generateModifiedRules(style, rootComputedStyle);
        if (modifiedCssRules && modifiedCssRules.length > 0) {
            return generateStyleElement(modifiedCssRules);
        }
        return null;
    });

    originalStyleElemList.forEach((item, index) => {
        const injectedStyleElem = injectedStyleElemList[index];
        if (injectedStyleElem) {
            item.insertAdjacentElement('afterend', injectedStyleElemList[index]);
        }
        if (item.classList.contains(`${CLASS_PREFIX}-cors`)) {
            item.remove();
        }
    });
}
