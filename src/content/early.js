import { MessageType } from "../utils/message";
import { CLASS_PREFIX } from "./const";
import { getSystemColorTheme } from "./utils";

const EARLY_STYLE = `
*{
    color: #fff !important;
    background: rgb(24,26,27) !important;
    border-color: rgb(24,26,27) !important;
    box-shadow:0 0 8px rgb(24,26,27) !important;
}
`;

export async function injectEarlyStyle() {
    if (typeof browser === 'undefined') {
        // eslint-disable-next-line
        var browser = chrome;
    }

    const theme = await browser.runtime.sendMessage({ type: MessageType.QUERY_THEME, hostname: location.hostname });
    if (theme === "light" || (theme === "system" && getSystemColorTheme() === "light")) return;

    const styleEle = document.createElement('style');
    styleEle.classList.add(`${CLASS_PREFIX}-early`);
    styleEle.textContent = EARLY_STYLE;
    document.documentElement.appendChild(styleEle);
}
