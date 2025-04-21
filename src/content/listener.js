import { handleStyleElem, injectDynamicTheme } from "../content/core";
import { CLASS_PREFIX } from "./const";
import { isInstanceOf } from "./utils";

if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

export async function setupDomListener(target) {
    let observer = null;
    function handleShadowRootConstructedStyle(target) {
        console.log("handle constructed style", target);
    }

    async function setTheme(theme, target) {
        if (observer) {
            observer.disconnect();
            observer = null;
        }

        if (theme === "light") {
            document.querySelectorAll(CLASS_PREFIX).forEach(e => e.remove());
        }

        if (theme === "dark") {
            if (target instanceof ShadowRoot) {
                handleShadowRootConstructedStyle(target);
            }
            await injectDynamicTheme(target);
            target.querySelector("style.dark-bili-early")?.remove();
            observer = observeTarget(target);
        }
    }

    function observeTarget(target) {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(item => {
                        injectDynamicTheme(item);
                    });
                }
            }
        });
        observer.observe(target, { childList: true, subtree: true });
        return observer;
    }
    browser.runtime.onMessage.addListener((request) => {
        setTheme(request.theme, target);
    });

    try {
        const theme = await browser.runtime.sendMessage({ type: "QUERY_THEME" });
        await setTheme(theme, target);
    } catch (err) {
        console.error(err);
    }
}

export async function setupStyleListener(styleElement, rootComputedStyle) {
    if (!isInstanceOf(styleElement, HTMLStyleElement)) {
        throw new TypeError("styleElem must be HTMLStyleElement but got", styleElement);
    }

    if (!isInstanceOf(rootComputedStyle, CSSStyleDeclaration)) {
        throw new TypeError("rootComputedStyle must be CSSStyleDeclaration but got", rootComputedStyle);
    }

    let observer = null;

    const observeStyle = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(() => {
                if (styleElement.relatedStyle) {
                    styleElement.relatedStyle.remove();
                }
                handleStyleElem(styleElement, rootComputedStyle);
            });
        });
        observer.observe(styleElement, { childList: true, subtree: true, characterData: true });
        return observer;
    };

    browser.runtime.onMessage.addListener((request) => {
        const theme = request.theme;
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (theme === "dark") {
            observer = observeStyle();
        }
    });

    observeStyle();
}
