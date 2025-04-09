import { extractHSL, extractRGB, extractRgbFromHex, hslToString, invertHslColor, invertRgbColor, isDarkColor, rgbToHexText, rgbToText } from "./color.js";
import { CLASS_PREFIX, STYLE_SELECTOR, COLOR_KEYWORDS } from "./const.js";

const rootComputedStyle = getComputedStyle(document.documentElement);

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
    return /^(rgba?\(|hsla?\(|#|var\()/i.test(color);

}

function isOtherColorCssVar(variable) {
    return isOtherColor(rootComputedStyle.getPropertyValue(variable).trim());
}

function invertColor(prop, color) {
    if (typeof color !== "string") {
        return color;
    }

    if (isKeyWordColor(color) || !isOtherColor(color)) {
        return color;
    }

    if (/^rgba?\([\d., ]+\)/.test(color)) {
        const [r, g, b] = extractRGB(color);
        if ((isDarkColor(r, g, b) && /^background.*/i.test(prop)) || (!isDarkColor(r, g, b) && /^color/i.test(prop))) {
            return color;
        }
        return rgbToText(...invertRgbColor(r, g, b));
    } else if (color.startsWith("#")) {
        const [r, g, b] = extractRgbFromHex(color);
        if ((isDarkColor(r, g, b) && /^background.*/i.test(prop)) || (!isDarkColor(r, g, b) && /^color/i.test(prop))) {
            return color;
        }
        return rgbToHexText(...invertRgbColor(r, g, b));
    } else if (/^hsla?\([\d, .%]+\)/.test(color)) {
        const [h, s, l] = extractHSL(color);
        if ((l < 0.5 && /background.*/.test(prop)) || (l >= 0.5 && /color/.test(prop))) {
            return color;
        }
        return hslToString(...invertHslColor(h, s, l));
    } else if (color.startsWith("var")) {
        const matchResult = color.match(/var\((--[a-z\d-]+)[, ]*([a-z\d#]+)?\)$/i);
        if (!matchResult) {
            return color;
        }
        // eslint-disable-next-line no-unused-vars
        const [_, varName, fallback] = matchResult;

        if (!isOtherColorCssVar(varName)) {
            return color;
        }

        return ` var(${varName}${fallback ? `, ${invertColor(fallback)}` : ""})`;
    } else {
        return color;
    }
};

export async function injectDynamicTheme() {
    const originalStyleElemList = await Promise.all(getStyles(document).map(async (s) => {
        let styleTextContent = "";
        const injectStyleElem = document.createElement("style");
        injectStyleElem.classList.add(CLASS_PREFIX);
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

    const injectedStyleElemList = originalStyleElemList.map(style => {
        if (!style.sheet) {
            return null;
        }

        const { cssRules } = style.sheet;
        const modifiedCssRules = [];
        for (let i = 0; i < cssRules.length; i += 1) {
            if (!(cssRules[i] instanceof CSSStyleRule)) {
                continue;
            }

            const cssStyleRule = cssRules[i];
            const cssStyleRuleStyle = cssStyleRule.style;
            const modifiedRules = [];

            for (const prop of cssStyleRuleStyle) {
                const value = cssStyleRuleStyle.getPropertyValue(prop).trim();
                const newValue = value.replaceAll(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-f]{3,8}|var\(--[^)]+\)|\b[a-z-]+\b)/gi,
                    color => invertColor(prop, color)
                );

                if (value === newValue) {
                    continue;
                }

                modifiedRules.push({ prop, newValue });
            }

            if (modifiedRules.length > 0) {
                modifiedCssRules.push({ selectText: cssStyleRule.selectorText, rules: modifiedRules });
            }
        }

        style.remove();

        if (modifiedCssRules.length > 0) {
            const injectedStyleElem = document.createElement("style");
            injectedStyleElem.classList.add(CLASS_PREFIX);
            injectedStyleElem.type = "text/css";
            let textContent = "";

            modifiedCssRules.forEach(cssRule => {
                textContent += cssRule.selectText + "{\n";
                cssRule.rules.forEach(rule => {
                    const { prop, newValue } = rule;
                    textContent += `${prop}: ${newValue};\n`;
                });
                textContent += "}\n";
            });
            injectedStyleElem.textContent = textContent;

            return injectedStyleElem;
        }

        return null;
    }).filter(item => item);

    document.body.append(...injectedStyleElemList);
}
