export const BASIC_STYLE = `
.desktop-download-tip, .palette-button-outer, .floor-single-card, .ad-report, .bgc{
    display: none;
}

.message-bg{
    display: none;
}
`;

export function injectBasicStyle() {
    const styleEle = document.createElement('style');
    styleEle.textContent = BASIC_STYLE;
    document.documentElement.appendChild(styleEle);
}
