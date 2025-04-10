if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

async function setTabTheme(theme) {
    browser.runtime.sendMessage({ type: "APPLY_THEME", theme });
}

await(async function() {
    // add listener
    const switchCheckbox = document.querySelector('.switch>input');

    if (!switchCheckbox) return;

    // load config
    await browser.runtime.sendMessage({ type: "QUERY_THEME" }, response => {
        switchCheckbox.checked = response === "light" ? false : true;
    });

    switchCheckbox.addEventListener('change', e => {
        const theme = e.target.checked ? 'dark' : 'light';
        setTabTheme(theme);
    });
})();
