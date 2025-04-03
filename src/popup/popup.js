if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

async function loadConfig() {
    try {
        const theme = await localStorage.getItem('theme');
        if (typeof theme !== 'string') {
            await saveConfig('light');
            return "light";
        };
        return theme;
    } catch (error) {
        console.error(error);
        return 'dark';
    }
}

async function saveConfig(theme) {
    try {
        await localStorage.setItem("theme", theme);
    } catch (error) {
        console.error(error);
    }
}

async function sendMessage(theme) {
    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs.length <= 0) return;

        const activeTabId = tabs[0].id;

        browser.tabs.sendMessage(activeTabId, { theme });
    } catch (err) {
        console.error(err);
        return Promise.reject(err);
    }
}

await(async function() {
    // add listener
    const switchCheckbox = document.querySelector('.switch>input');

    if (!switchCheckbox) return;

    switchCheckbox.addEventListener('change', e => {
        const theme = e.target.checked ? 'dark' : 'light';
        sendMessage(theme).then(() => {
            saveConfig(theme);
        });
    });

    // load config
    const theme = await loadConfig();
    switchCheckbox.checked = theme === "light" ? false : true;
})();
