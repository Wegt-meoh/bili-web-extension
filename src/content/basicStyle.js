function injectBasicStyle() {
    // css style to hide wide picture
    const styleEle = document.createElement('style');
    styleEle.classList.add("dark-bili-basic");

    // normal
    styleEle.textContent = `
    .desktop-download-tip{
        display: none
    }

    .palette-button-outer,.floor-single-card{
        display: none
    }

    .ad-report{
        display:none;
    }
    `;

    (document.head || document.documentElement).appendChild(styleEle);
}

injectBasicStyle();
