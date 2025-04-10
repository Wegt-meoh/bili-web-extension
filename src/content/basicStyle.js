import { BASIC_STYLE } from "./const";

export function injectBasicStyle() {
    const styleEle = document.createElement('style');
    styleEle.textContent = BASIC_STYLE;
    (document.head || document.documentElement).appendChild(styleEle);
}
