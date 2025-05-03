export function modifyVideo() {
    let video;
    document.addEventListener('keydown', (e) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
            return;
        }
        if (!video) {
            video = document.querySelector("video");
        }

        if (!video) {
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
