const SESSION_STORAGE_KEY_PREFIX_CSS_CACHE = "__dark_bili_css_cache";

export function writeCssFetchCache(url, data) {
    try {
        sessionStorage.setItem(SESSION_STORAGE_KEY_PREFIX_CSS_CACHE + "_" + url, data);
    } catch { ; }
}

export function readCssFetchCache(url) {
    try {
        return sessionStorage.getItem(SESSION_STORAGE_KEY_PREFIX_CSS_CACHE + "_" + url);
    } catch {
        return null;
    }
}
