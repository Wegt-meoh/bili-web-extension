import { generateModifiedRules, handleStyleElem, injectDynamicTheme, rulesToCssText } from "../content/core";
import { CLASS_PREFIX } from "./const";
import { isInstanceOf } from "./utils";

if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

export async function setupDomListener(target) {
    let currentTheme;
    function handleShadowRootConstructedStyle(target) {
        if (!(target instanceof ShadowRoot)) {
            return;
        }

        const styleSheetList = target.adoptedStyleSheets.filter(s => s.tag !== CLASS_PREFIX);
        const modifiedRulesList = styleSheetList.map(styleSheet => generateModifiedRules(styleSheet.cssRules, target)).filter(i => i !== null);
        const injectedCssStyleSheetList = modifiedRulesList.map(rules => {
            const styleSheet = new CSSStyleSheet();
            styleSheet.replaceSync(rulesToCssText(rules));
            styleSheet.tag = CLASS_PREFIX;
            return styleSheet;
        });
        target.adoptedStyleSheets.push(...injectedCssStyleSheetList);
    }

    async function setTheme() {
        const messageBgElme = target === document.documentElement ? document.querySelector(".message-bg") : null;

        if (currentTheme === "light") {
            if (messageBgElme) {
                const style = messageBgElme.getAttribute("style");
                messageBgElme.setAttribute("style", style.replace("dark", "light"));
            }
            target.querySelectorAll(`.${CLASS_PREFIX}`).forEach(e => e.remove());
            if (target instanceof ShadowRoot) {
                target.adoptedStyleSheets = target.adoptedStyleSheets.filter(s => s.tag !== CLASS_PREFIX);
            }
        }

        if (currentTheme === "dark") {
            if (target instanceof ShadowRoot) {
                handleShadowRootConstructedStyle(target);
            }
            if (messageBgElme) {
                const style = messageBgElme.getAttribute("style");
                messageBgElme.setAttribute("style", style.replace("light", "dark"));
            }
            await injectDynamicTheme(target);
            target.querySelector("style.dark-bili-early")?.remove();
        }
    }

    function observeTarget(target) {
        const observer = new MutationObserver((mutationsList) => {
            if (currentTheme === "light") {
                return;
            }
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
        currentTheme = request.theme;
        setTheme();
    });

    try {
        const theme = await browser.runtime.sendMessage({ type: "QUERY_THEME" });
        currentTheme = theme;
        observeTarget(target);
        setTheme();
    } catch (err) {
        console.error(err);
    }
}

export async function setupStyleListener(styleElement, root) {
    if (!isInstanceOf(styleElement, HTMLStyleElement)) {
        throw new TypeError("styleElem must be HTMLStyleElement but got", styleElement);
    }

    let currentTheme;

    const observeStyle = () => {
        const observer = new MutationObserver(() => {
            if (currentTheme === "light") {
                return;
            }
            styleElement.relatedStyle?.remove();
            handleStyleElem(styleElement, root);
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
        handleStyleElem(styleElement, root);
    });

    observeStyle();
}
