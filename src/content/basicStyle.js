function injectBasicStyle() {
    // css style to hide wide picture
    const styleEle = document.createElement('style');

    // normal
    styleEle.textContent = `
    .desktop-download-tip, .palette-button-outer, .floor-single-card, .ad-report, .bg, .bgc{
        display: none;
    }

    .dark-bili, .dark-bili body{
        background: #fff;
    }
    `;

    (document.head || document.documentElement).appendChild(styleEle);
}

injectBasicStyle();
