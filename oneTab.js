// Block new tab attempts
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
        e.preventDefault();
        window.location.href = link.href;
    }
});

const video = document.querySelector("video");

while (video && video !== document.activeElement) {
    video.focus();
}

document.addEventListener('keydown', (e) => {
    const volumeHint = document.querySelector(".bpx-player-volume-hint");
    const volumeHintText = volumeHint.querySelector(".bpx-player-volume-hint-text");

    if (!video || !volumeHint || !volumeHintText) {
        return;
    }

    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
        return;
    }

    video.muted = false;
    e.preventDefault();

    const flag = e.key === "ArrowDown" ? false : true;

    if (video === document.activeElement) {
        video.volume = (Math.round(video.volume * 100) - (flag ? 5 : -5)) / 100;
        return;
    }

    video.volume = (Math.round(video.volume * 100) + (flag ? 5 : -5)) / 100;
    volumeHintText.innerText = `${Math.round(video.volume * 100)}%`;

    volumeHint.style = "opacity: 1;";
    setTimeout(() => {
        volumeHint.style = "opacity: 0;display:none;";
    }, 1000);
});