if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

function setTabTheme(theme) {
    browser.runtime.sendMessage({ type: "APPLY_THEME", theme });
}

await(async function() {
    // add listener
    const switchButton = document.querySelector('.switch');

    if (!switchButton) return;

    // load config
    const theme = await browser.runtime.sendMessage({ type: "QUERY_THEME" });
    switchButton.textContent = theme;
    switchButton.addEventListener('click', () => {
        switch (switchButton.textContent) {
            case "light":
                switchButton.textContent = "dark";
                break;
            case "dark":
                switchButton.textContent = "system";
                break;
            case "system":
                switchButton.textContent = "light";
                break;
            default:
                switchButton.textContent = "light";
        }
        setTabTheme(switchButton.textContent);
    });
})();
