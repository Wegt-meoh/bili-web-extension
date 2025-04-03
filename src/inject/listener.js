import { CLASS_PREFIX } from "../inject/const";
import { injectDynamicTheme } from "../inject/dynamicTheme";

export async function setupListener() {
    if (typeof browser === 'undefined') {
        // eslint-disable-next-line
        var browser = chrome;
    }

    browser.runtime.onMessage.addListener((request, _, sendResponse) => {
        setTheme(request.theme);
    });


}

async function setTheme(theme) {
    switch (theme) {
        case 'light':
            document.querySelector(`style.${CLASS_PREFIX}`)?.remove();
            break;
        default:
            injectDynamicTheme();
            break;
    }
}
