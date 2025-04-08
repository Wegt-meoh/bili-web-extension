import { extractHSL, extractRGB, extractRgbFromHex, hslToString, invertHslColor, invertRgbColor, rgbToHexText, rgbToText } from "./color.js";
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

export async function injectDynamicTheme() {
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

    const invertColor = (color) => {
        if (typeof color !== "string") {
            throw new Error("color must be string");
        }

        if (isKeyWordColor(color) || !isOtherColor(color)) {
            return color;
        }

        if (/^rgba?/.test(color)) {
            return rgbToText(...invertRgbColor(...extractRGB(color)));
        } else if (color.startsWith("#")) {
            return rgbToHexText(...invertRgbColor(...extractRgbFromHex(color)));
        } else if (color.startsWith("hsl")) {
            return hslToString(...invertHslColor(...extractHSL(color)));
        }
        else if (color.startsWith("var")) {
            const matchResult = color.match(/var\((--[a-z\d-]+)[, ]*([a-z\d]+)?\)$/i);
            if (!matchResult) {
                return color;
            }
            // eslint-disable-next-line no-unused-vars
            const [_, varName, fallback] = matchResult;
            if (!isOtherColorCssVar(varName)) {
                return color;
            }
            const prefixVar = `--${CLASS_PREFIX}-${varName.slice(2)}`;
            return `var(${prefixVar}${fallback ? `, ${invertColor(fallback)}` : ""})`;
        } else {
            return color;
        }
    };

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
                const newValue = value.replaceAll(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-f]{3,8}|var\(--[^)]+\)|\b[a-z-]+\b)/gi, color => invertColor(color)
                );

                if (value === newValue) {
                    continue;
                }

                if (prop.startsWith("--")) {
                    modifiedRules.push({ prop: `--${CLASS_PREFIX}-${prop.slice(2)}`, newValue });
                } else {
                    modifiedRules.push({ prop, newValue });
                }
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

    document.head.append(...injectedStyleElemList);
}
