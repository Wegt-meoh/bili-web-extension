import { MessageType } from "../utils/message";
import { readCssFetchCache, writeCssFetchCache } from "./cache";

if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

export async function loadAsText(url, origin) {
    const credentials = url.startsWith(origin) ? undefined : "omit";
    const parsedUrl = new URL(url);
    const controller=new AbortController();
    const signal=controller.signal;
    const timeout=setTimeout(()=>{controller.abort();},3000);
    try {
        const resp = await fetch(parsedUrl, {
            cache: "force-cache",
            referrer: origin,
            signal,
            credentials
        });
        clearTimeout(timeout);
        if (resp.ok) {
            return resp.text();
        }
        return "";
    } catch {
        return "";
    }
};

/**
 * fetch the url resource as text, if any error occurred then return ""
 * @param {string} url 
 * @param {string} origin 
 */
async function bgFetch(url, origin) {
    return await browser.runtime.sendMessage({ type: MessageType.FETCH, url, origin });
}

export async function loadText(url, origin) {
    let data = readCssFetchCache(url);
    if (data !== null) {
        return data;
    }
    if (url.startsWith(origin)) {
        data = await loadAsText(url, origin);
    } else {
        data = await bgFetch(url, origin);
    }
    if (data !== "") {
        writeCssFetchCache(url, data);
    }
    return data;
}
