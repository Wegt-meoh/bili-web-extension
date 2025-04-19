import { BASIC_STYLE, CLASS_PREFIX } from "./const";

export function injectBasicStyle() {
    const styleEle = document.createElement('style');
    styleEle.classList.add(`${CLASS_PREFIX}-basic`);
    styleEle.textContent = BASIC_STYLE;
    (document.head || document.documentElement).appendChild(styleEle);
}
