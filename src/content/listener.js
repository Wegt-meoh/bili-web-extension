import { generateModifiedRules, handleStyleElementAndLinkElement, injectDynamicTheme } from "../content/core";
import { CLASS_PREFIX } from "./const";
import { injectFallbackStyle } from "./fallback";
import { cssBlocksToText, getStyleSheetText, parseCssStyleSheet } from "./utils";

if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

export async function setupDomListener(target) {
    if (target.hasSetup) {
        return;
    }
    target.hasSetup = true;

    let currentTheme;
    function handleShadowRootConstructedStyle(target) {
        if (!(target instanceof ShadowRoot)) {
            return;
        }

        const styleSheetList = target.adoptedStyleSheets.filter(s => s.tag !== CLASS_PREFIX);
        const modifiedRulesList = styleSheetList
            .map(sheet => generateModifiedRules(parseCssStyleSheet(getStyleSheetText(sheet)), target))
            .filter(i => i !== null);
        const injectedCssStyleSheetList = modifiedRulesList.map(rules => {
            const styleSheet = new CSSStyleSheet();
            styleSheet.replaceSync(cssBlocksToText(rules));
            styleSheet.tag = CLASS_PREFIX;
            return styleSheet;
        });
        target.adoptedStyleSheets.push(...injectedCssStyleSheetList);
    }

    async function setTheme() {
        if (currentTheme === "light") {
            // clear injected style
            target.querySelectorAll(`[class*=${CLASS_PREFIX}]`).forEach(e => e.remove());

            let divBg = target.querySelector("div.bg");
            if (divBg instanceof HTMLElement) {
                let bgImage = divBg.style.getPropertyValue("background-image");

                if (bgImage === "") {
                    bgImage = getComputedStyle(divBg).getPropertyValue("background-image");
                }

                if (bgImage !== "") {
                    divBg.style.setProperty("background-image", bgImage.replace("bg_dark", "bg"));
                }
            }

            // handle for shadowRoot adoptedStyleSheet
            if (target instanceof ShadowRoot) {
                target.adoptedStyleSheets = target.adoptedStyleSheets.filter(s => s.tag !== CLASS_PREFIX);
            }
        }

        if (currentTheme === "dark") {
            // inject fallback style
            injectFallbackStyle(target);

            let divBg = target.querySelector("div.bg");
            if (divBg instanceof HTMLElement) {
                let bgImage = divBg.style.getPropertyValue("background-image");

                if (bgImage === "") {
                    bgImage = getComputedStyle(divBg).getPropertyValue("background-image");
                }

                if (bgImage !== "") {
                    divBg.style.setProperty("background-image", bgImage.replace("bg", "bg_dark"));
                }
            }

            // handle for shadowRoot adoptedStyleSheet
            if (target instanceof ShadowRoot) {
                handleShadowRootConstructedStyle(target);
            }

            // injected dark theme style
            await injectDynamicTheme(target);

            // remove early style
            target.querySelector(`style.${CLASS_PREFIX}-early`)?.remove();
        }
    }

    function observeTarget(target) {
        const observer = new MutationObserver((mutationList) => {
            if (currentTheme === "light") {
                return;
            }
            for (const mutation of mutationList) {
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
        currentTheme = request.theme;
        setTheme();
    });

    try {
        const theme = await browser.runtime.sendMessage({ type: "QUERY_THEME" });
        currentTheme = theme;
        observeTarget(target);
        // ensure the observer setup before setTheme because content.js does not block browser 
        setTheme();
    } catch (err) {
        console.error(err);
    }
}

export function setupStyleListener(styleElement) {
    if (!(styleElement instanceof HTMLStyleElement)) {
        console.error("styleElem must be HTMLStyleElement but got", styleElement);
        return;
    }

    let currentTheme;

    const observeStyle = () => {
        const observer = new MutationObserver(() => {
            if (currentTheme === "light") {
                return;
            }
            styleElement.relatedStyle?.remove();
            handleStyleElementAndLinkElement({ textContent: styleElement.textContent, source: styleElement });
        });
        observer.observe(styleElement, { childList: true, subtree: true, characterData: true });
        return observer;
    };

    browser.runtime.onMessage.addListener((request) => {
        currentTheme = request.theme;
        styleElement.relatedStyle?.remove();
        if (currentTheme === "light") {
            return;
        }
        handleStyleElementAndLinkElement({ textContent: styleElement.textContent, source: styleElement });
    });

    observeStyle();
}

const observedRootList = [];

export function setupThemeListener(target, onListen, onObserve, mutationOption) {
    if (!(target instanceof HTMLElement)) {
        return;
    }

    let currentTheme;
    let observer;
    const root = target.getRootNode();

    const handleOnMessage = (request) => {
        currentTheme = request.theme;
        if (onListen) {
            onListen(currentTheme);
        }
    };

    browser.runtime.onMessage.addListener(handleOnMessage);

    if (onObserve) {
        observer = new MutationObserver((mutationList) => {
            onObserve(mutationList, currentTheme);
        });
        observer.observe(target, mutationOption);
    }

    if (!observedRootList.includes(root)) {
        const newRootObserver = new MutationObserver((mutations) => {
            mutations.forEach(() => {
                let i = 0;
                while (i < root.listenedItems.length) {
                    if (!root.contains(root.listenedItems[i].target)) {
                        const { listenFunc, observer } = root.listenedItems[i];
                        browser.runtime.onMessage.removeListener(listenFunc);
                        if (observer instanceof MutationObserver) {
                            observer.disconnect();
                        }
                        root.listenedItems.splice(i, 1);
                    } else {
                        i += 1;
                    }
                }
            });
        });
        observedRootList.push(root);
        root.listenedItems = [];
        newRootObserver.observe(root, { childList: true, subtree: true });
    }

    root.listenedItems.push({
        target,
        listenFunc: handleOnMessage,
        observer
    });
}
