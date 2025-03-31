export function modifyVideo() {
    const video = document.querySelector("video");
    if (video) {
        video.tabIndex = -1;

        document.addEventListener('keydown', (e) => {
            const volumeHint = document.querySelector(".bpx-player-volume-hint");
            const volumeHintText = volumeHint?.querySelector(".bpx-player-volume-hint-text");

            if (!video || !volumeHint || !volumeHintText) {
                return;
            }

            if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
                return;
            }

            video.muted = false;

            const flag = e.key === "ArrowDown" ? false : true;

            video.focus();
            const val = (Math.round(video.volume * 100) - (flag ? 5 : -5)) / 100;
            video.volume = val < 0 ? 0 : val > 1 ? 1 : val;
            return;
        });
    }
}
