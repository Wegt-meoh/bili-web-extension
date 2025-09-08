import { CLASS_PREFIX } from "./const";
import { insertHeadStyle } from "./utils";

function shouldIgnore() {
    return location.hostname.includes("bilibili.com") ? false : true;
}

export function insertFixedBilibiliStyle() {
    if (shouldIgnore()) return;
    const css = `
    .desktop-download-tip, .palette-button-outer, .floor-single-card, .ad-report, .bgc{
        display: none;
    }
    #app>.message-bg{
        background-image: url("//i0.hdslb.com/bfs/seed/jinkela/short/message/img/dark_bg.png@1c.webp") !important;
    }
    #app>.bg{
        background-image: url("//i0.hdslb.com/bfs/static/stone-free/dyn-home/assets/bg_dark.png@1c.avif") !important;
    }
    `;

    insertHeadStyle(css, "end", CLASS_PREFIX + "-fix");
}

export function handleBilibiliVideo() {
    if (shouldIgnore()) return;

    let video;
    document.addEventListener('keydown', (e) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
            return;
        }

        if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }

        if (!video) {
            video = document.querySelector("video");
        }

        if (!video || document.activeElement instanceof HTMLInputElement) {
            return;
        }

        video.tabIndex = -1;
        video.muted = false;
        const flag = e.key === "ArrowDown" ? false : true;
        video.focus();
        const val = (Math.round(video.volume * 100) - (flag ? 5 : -5)) / 100;
        video.volume = val < 0 ? 0 : val > 1 ? 1 : val;
    });
}
