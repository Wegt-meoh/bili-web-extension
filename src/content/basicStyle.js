import { CLASS_PREFIX } from "./const";

export const BASIC_STYLE = `
.desktop-download-tip, .palette-button-outer, .floor-single-card, .ad-report, .bg, .bgc{
    display: none;
}
`;

export function injectBasicStyle() {
    const styleEle = document.createElement('style');
    styleEle.classList.add(`${CLASS_PREFIX}-basic`);
    styleEle.textContent = BASIC_STYLE;
    document.documentElement.appendChild(styleEle);
}
