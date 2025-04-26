import * as csstree from "css-tree";

export function isInstanceOf(child, father) {
    return child instanceof father;
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
        console.warn('Cannot access stylesheet:', e);
        return '';
    }
}
