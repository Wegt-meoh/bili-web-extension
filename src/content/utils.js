import * as csstree from "css-tree";

export function parsePerValue(value){
    const newValue=csstree.parse(value,{context:"value"});
    return newValue.children.first;
}

/**
 * 
 * @param {string} text 
 * @returns {csstree.CssNode}
 */
export function parseInlineStyle(text) {
    return csstree.parse(text, { context: "declarationList",parseCustomProperty: true });
}

/**
 * 
 * @param {string} text 
 * @returns {csstree.CssNode}
 */
export function parseCssStyleSheet(text) {
    const ast = csstree.parse(text,{parseCustomProperty: true});
    return ast;
}

export function getStyleSheetText(sheet) {
    try {
        if (!sheet.cssRules) {
            return ''; // Empty or inaccessible (e.g., CORS-restricted)
        }
        let text = '';
        for (const rule of sheet.cssRules) {
            text += rule.cssText + '\n';
        }
        return text;
    } catch (e) {
        Logger.log(e);
        return '';
    }
}

export function classNameToSelectorText(className) {
    if (typeof className !== "string") {
        return "";
    }

    return className.split(" ").reduce((prev, curr) => `${prev}.${curr}`, "");
}

export function cssBlocksToText(cssBlocks) {
    let text = "";
    cssBlocks.forEach(block => {
        const { selectorText, rules } = block;
        text += selectorText + "{\n";
        text += cssDeclarationToText(rules);
        text += "}\n";
    });
    return text;
}

export function cssDeclarationToText(declarations) {
    let result = "";
    declarations.forEach(de => {
        result += `${de.prop}:${de.value};`;
    });
    return result;
}

export function getSystemColorTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
}

export class Logger {
    static log(...messages) {
        console.log("bili-web-extension log: ", ...messages);
    }

    static err(...reasons) {
        console.error("bili-web-extension error: ", ...reasons);
    }
}

/**
 * @param {string} css
 * @param {"start"|"end"} position
 * @param {string[]} className
 */
export function insertHeadStyle(css, position, className = []) {
    const styleEle = document.createElement('style');
    styleEle.textContent = css;
    styleEle.classList.add(...className);
    const insert = () => {
        document.head.insertAdjacentElement(position === "start" ? "afterbegin" : "beforeend", styleEle);
    };
    if (!document.head) {
        const headObserver = new MutationObserver(() => {
            if (document.head) {
                headObserver.disconnect();
                insert();
            }
        });
        headObserver.observe(document.documentElement, { childList: true });
        return;
    }
    insert();
}
