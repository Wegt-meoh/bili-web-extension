export function injectBasicStyle() {
    // css style to hide wide picture
    const styleEle = document.createElement('style');

    // normal
    styleEle.textContent = `
    .recommended-swipe.grid-anchor{
        display: none
    }

    .desktop-download-tip{
        display: none
    }

    .my-custom-button{
        position: absolute;
        top: 81px;
        left: 100%;
    }

    .palette-button-outer,.floor-single-card{
        display: none
    }

    .recommended-container_floor-aside>.container>div:not(.feed-card) {
        display: none;
    }

    .ad-report{
        display:none;
    }
    `;

    document.head.appendChild(styleEle);
}
