(function () {
    // css style to hide wide picture
    const styleEle = document.createElement('style')

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
    `

    document.head.appendChild(styleEle)
})()