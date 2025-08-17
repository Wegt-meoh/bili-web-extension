import * as csstree from "css-tree";

export function parseStyleAttribute(text) {
    const ast = csstree.parse(text, { context: "declarationList" });
    const result = [];
    csstree.walk(ast, node => {
        if (node.type === "Declaration") {
            result.push({
                prop: node.property,
                value: csstree.generate(node.value),
                important: node.important
            });
        }
    });
    return result;
}

export function parseCssStyleSheet(text) {
    const ast = csstree.parse(text);
    const styleCssRules = [];
    csstree.walk(ast, node => {
        if (node.type !== "Rule" && node.type !== "StyleSheet") {
            return csstree.walk.skip;
        }

        if (node.type !== "Rule") return;

        const selectorText = csstree.generate(node.prelude);
        const rules = [];
        node.block.children.forEach(child => {
            if (child.type === "Declaration") {
                rules.push({
                    prop: child.property,
                    value: csstree.generate(child.value),
                    important: child.important
                });
            }
        });
        styleCssRules.push({ selectorText, rules });
    });
    return styleCssRules;
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
    static log(msg) {
        console.log("bili-web-extension: catch err", msg);
    }

    static err(reason) {
        console.error("bili-web-extension: catch err", reason);
    }
}
