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

export class SelectedElementStorage{
    constructor(){
        this.storage=new Map();
    }

    insert(selectorText,element){
        this.storage.set(selectorText,element);
    }

    get(selectorText){
        return this.storage.get(selectorText);
    }
}

export class CustomPropertyStorage{
    constructor(){
        this.storage=new Map();
    }

    insert(name,isColorVar){
        // although there are two properties has same name
        // the propType of them are assumed to be same
        if (isColorVar){
            this.storage.set(name,isColorVar);
        }
    }

    get(name){
        return this.storage.get(name);
    }
}
