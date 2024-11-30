async function saveConfig(theme) {
    try {
        await browser.storage.local.set({ theme })
    } catch (error) {
        console.error(error)
    }
}

async function loadConfig() {
    try {
        let { theme } = await browser.storage.local.get('theme')
        if (typeof theme !== 'string') {
            throw new Error(`get theme failed: `, theme)
        }
        return theme
    } catch (error) {
        console.error(error)
        return 'dark'
    }
}

async function setTheme(theme) {
    switch (theme) {
        case 'light':
            document.documentElement.classList.remove('dark-bili')
            break;
        default:
            document.documentElement.classList.add('dark-bili')
            break;
    }
    await saveConfig(theme)
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    setTheme(request.theme)
});


// load default settings
loadConfig().then(theme => {
    setTheme(theme)
}).catch(err => {
    console.error(`load config failed: ${err}`)
})