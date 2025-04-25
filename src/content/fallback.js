import { CLASS_PREFIX } from "./const";
import { addCssPrefix } from "./core";

const FALLBACK_STYLE = `
.bili-comments-bottom-fixed-wrapper>div{
background-color: var(${addCssPrefix("bg", "--bg1")}) !important;
border-top-color: var(${addCssPrefix("border", "--graph_bg_thick")}) !important;
}
`;

export async function injectFallbackStyle(root) {
    if (typeof browser === 'undefined') {
        // eslint-disable-next-line
        var browser = chrome;
    }

    const theme = await browser.runtime.sendMessage({ type: "QUERY_THEME" });
    if (theme === "light") return;

    const styleEle = document.createElement('style');
    styleEle.classList.add(`${CLASS_PREFIX}-fallback`);
    styleEle.textContent = FALLBACK_STYLE;
    root.appendChild(styleEle);
}
