if (typeof browser === 'undefined') {
    var browser = chrome
}

async function loadConfig() {
    try {
        const { theme } = await browser.storage.local.get('theme')
        if (typeof theme !== 'string') {
            await saveConfig('light')
            return "light"
        };
        return theme
    } catch (error) {
        console.error(error)
        return 'dark'
    }
}

async function saveConfig(theme) {
    try {
        await browser.storage.local.set({ theme })
    } catch (error) {
        console.error(error)
    }
}

function sendMessage(theme) {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs.length <= 0) return;

        const activeTabId = tabs[0].id;

        browser.tabs.sendMessage(activeTabId, { theme })
    });
}

await(async function () {
    // add listener
    const switchCheckbox = document.querySelector('.switch>input')

    if (!switchCheckbox) return;

    switchCheckbox.addEventListener('change', e => {
        const theme = e.target.checked ? 'dark' : 'light'

        sendMessage(theme)
    })

    // load config
    const theme = await loadConfig()
    switchCheckbox.checked = theme === "light" ? false : true
})()