function injectBasicStyle() {
    // css style to hide wide picture
    const styleEle = document.createElement('style');

    // normal
    styleEle.textContent = `
    .desktop-download-tip, .palette-button-outer, .floor-single-card, .ad-report, .bg, .bgc{
        display: none;
    }

    .dark-bili body{
        background: rgb(24, 26, 27);
    }
    `;

    (document.head || document.documentElement).appendChild(styleEle);
}

injectBasicStyle();
