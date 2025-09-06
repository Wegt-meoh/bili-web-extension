import { MessageType } from "../utils/message";
import { readCssFetchCache, writeCssFetchCache } from "./cache";

if (typeof browser === 'undefined') {
    // eslint-disable-next-line
    var browser = chrome;
}

export async function loadAsText(url, origin) {
    if (typeof url !== "string") {
        throw new TypeError("url must be string but got", url);
    }

    if (typeof origin !== "string") {
        throw new TypeError("origin must be string but got", origin);
    }

    const credentials = url.startsWith(origin) ? undefined : "omit";
    const parsedUrl = new URL(url);
    const resp = await fetch(parsedUrl, {
        cache: "force-cache",
        referrer: origin,
        credentials
    });
    if (resp.ok) {
        return resp.text();
    }
    throw new Error(`Unable to load ${url} ${resp.status} ${resp.statusText}`);
};

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
    writeCssFetchCache(url, data);
    return data;
}
