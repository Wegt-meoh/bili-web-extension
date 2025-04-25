import { CLASS_PREFIX, EARLY_STYLE } from "./const";

export async function injectEarlyStyle() {
    if (typeof browser === 'undefined') {
        // eslint-disable-next-line
        var browser = chrome;
    }

    const theme = await browser.runtime.sendMessage({ type: "QUERY_THEME" });
    if (theme === "light") return;

    document.documentElement.classList.add(CLASS_PREFIX);

    const styleEle = document.createElement('style');
    styleEle.classList.add(`${CLASS_PREFIX}-early`);
    styleEle.textContent = EARLY_STYLE;
    document.documentElement.appendChild(styleEle);
}
