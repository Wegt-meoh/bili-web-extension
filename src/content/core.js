import { extractHSL, extractRGB, extractRgbFromHex, hslToText, invertHslColor, invertRgbColor, isDarkColor, rgbToHexText, rgbToHsl, rgbToText } from "./color.js";
import * as csstree from "css-tree";
import { CLASS_PREFIX, COLOR_KEYWORDS, defaultDarkColor, IGNORE_SELECTOR, PSEUDO_ELEMENT, STYLE_SELECTOR } from "./const.js";
import { injectUserAgentStyle } from "./fallback.js";
import { loadText } from "./network.js";
import { classNameToSelectorText, getStyleSheetText, needsProcessingValue, isCustomProperty, Logger, parseCssStyleSheet, parseInlineStyle, parsePerValue } from "./utils.js";
import { CustomPropertyStorage } from "./cache.js";

const customPropertyStore=new CustomPropertyStorage();

function isFontsGoogleApiStyle(element) {
    if (typeof element.href !== "string") {
        return false;
    }

    try {
        const elementURL = new URL(element.href);
        return elementURL.hostname === 'fonts.googleapis.com';
    } catch (err) {
        Logger.err(err);
        return false;
    }
}

function shouldManageStyle(element) {
    return (
        (element instanceof HTMLStyleElement) ||
        (element instanceof SVGStyleElement) ||
        (element instanceof HTMLLinkElement &&
            Boolean(element.rel) &&
            (element.rel.toLowerCase().includes("stylesheet") &&
                Boolean(element.href) &&
                !element.disabled &&
                (navigator.userAgent.toLowerCase().includes("firefox") ?
                    !element.href.startsWith("moz-extension://") : true
                ) &isFontsGoogleApiStyle(element)
            )
        ) &&
        element.media.toLowerCase() !== "print" &&
        !element.classList.contains("stylus"));
}

async function injectInDeep(target) {
    if (!(target instanceof Node)) {
        return;
    }

    const deliver = async (t) => {
        if (t.shadowRoot instanceof ShadowRoot) {
            await setupDynamicDarkThemeForShadowRoot(t.shadowRoot);
            return true;
        }
        return false;
    };

    if (await deliver(target)) {
        return;
    }

    const walker = document.createTreeWalker(
        target,
        NodeFilter.SHOW_ELEMENT,
        { acceptNode: () => NodeFilter.FILTER_ACCEPT }
    );

    while ((walker.nextNode())) {
        await deliver(walker.currentNode);
    }
}

function getStyles(element, result = []) {
    if (!(element instanceof Element) && !(element instanceof ShadowRoot)) {
        return result;
    }
    if (shouldManageStyle(element) && element.matches(STYLE_SELECTOR)) {
        result.push(element);
    } else {
        element?.querySelectorAll(STYLE_SELECTOR)?.forEach(item => {
            result.push(item);
        });
    }

    return result;
}

function isColorKeyword(color) {
    if (typeof color !== "string") {
        throw new TypeError("color should be string");
    }
    return COLOR_KEYWORDS.has(color.toLowerCase());
}

function getCssPropType(prop) {
    return /^background|^(?!--).*-shadow$/i.test(prop) ? "bg" : /^border|^outline|^column-rule|^stroke$/i.test(prop) ? "border" : /^(color|text-decoration-color|caret-color|fill)$/i.test(prop) ? "text" : "";
}

function shouldInvertColor(propType, l) {
    if (propType === "") {
        return false;
    }
    const isDarkColorResult = isDarkColor(l);
    if ((isDarkColorResult && (propType === "bg" || propType === "border")) || (!isDarkColorResult && propType === "text")) {
        return false;
    }
    return true;
}

function handleRgbColor(propType, color) {
    const rgbColor=extractRGB(color);
    if(rgbColor){
        const [r, g, b, a] = rgbColor;
        const [,,l]=rgbToHsl(r,g,b);
        if (!shouldInvertColor(propType, l)) {
            return color;
        }
        return rgbToText(...invertRgbColor(r, g, b ),a);
    }else{
        return undefined;
    }
}

/**
* @param {string} propType 
* @param {string} color #fff 
*/
function handleHexColor(propType, color) {
    const rgbColor=extractRgbFromHex(color);
    if(rgbColor){
        const [r, g, b, a] = rgbColor; 
        const [,,l]=rgbToHsl(r,g,b);
        if (!shouldInvertColor(propType,l)) {
            return color;
        }
        return rgbToHexText(...invertRgbColor(r, g, b, a));
    }
}

function handleHslColor(propType, color) {
    const hslColor=extractHSL(color);
    if(hslColor){
        const [h, s, l, a] = hslColor;
        if (!shouldInvertColor(propType, l)) {
            return color;
        }
        return hslToText(...invertHslColor(h, s, l, a));
    }
}

export function addCssPrefix(propType, variable) {
    if(propType===""){
        throw new Error("can not add prefix to unknown prop type for css variable",variable);
    }
    return `--${CLASS_PREFIX}-${propType}${variable}`;
}

function handleDirectRgb(propType, rgb) {
    let [r, g, b] = rgb.matchAll(/\d+/g);
    r = parseInt(r);
    g = parseInt(g);
    b = parseInt(b);

    const [,,l]=rgbToHsl(r/255,g/255,b/255);
    if (!shouldInvertColor(propType, l)) {
        return rgb;
    }

    const [i_r, i_g, i_b] = invertRgbColor(r, g, b);
    return `${i_r},${i_g},${i_b}`;
}


function checkShouldIgnore(selectorText) {
    const selectorList = selectorText.split(",").map(item => item.trim());
    for (const selector of selectorList) {
        if (IGNORE_SELECTOR.some(item => item === selector ? true : undefined)) {
            return true;
        }
    }
    return false;
}

// cache computed style by selectorText
function generateComputedMap(root) {
    const _computedStyleMap = {};
    const computedStyleMap = new Proxy(_computedStyleMap, {
        get(target, selectorText, reciever) {
            const value = Reflect.get(target, selectorText, reciever);
            if (value !== undefined) {
                return value;
            }
            const fallback = { getPropertyValue() { return ""; } };
            try {
                // find the target element by selector text
                let element = selectorText === ":host" ? root.host : root.querySelector(selectorText.replaceAll(/:hover/gi, "").replaceAll(PSEUDO_ELEMENT, ""));
                if (element === null) {
                    element = root instanceof ShadowRoot ? root.host : root.documentElement;
                }
                const style = getComputedStyle(element);
                Reflect.set(target, selectorText, style, reciever);
                return style;
            } catch (error) {
                Logger.log(error);
                return fallback;
            }
        }
    });
    return computedStyleMap;
}

/**
 * @param {csstree.List<csstree.CssNode>} declarationNodeList
 */
function handleDeclarationList(declarationNodeList) {
    const modifiedList=[];
    declarationNodeList.forEach(declaration=>{
        if(declaration.type==="Declaration"){
            modifiedList.push(...handleDeclaration(declaration)); 
        }
    });
    return modifiedList;
}

/**
 * @param {csstree.Declaration} declaration
 */
function handleDeclaration(declaration){
    const modified=[];
    if(declaration.value.type==="Raw"){
        declaration.value=csstree.parse(declaration.value.value,{context:"value"});
    }
    if(declaration.value.type==="Value"){
        const needsProcessingResult=needsProcessingValue(declaration.value,customPropertyStore);
        if(!needsProcessingResult) return modified;
        const oldValue=csstree.generate(declaration.value);
        const {property}=declaration;
        const isCustomPropertyResult=isCustomProperty(property);
        if(isCustomPropertyResult){
            customPropertyStore.insert(property,true);
        }
        const propTypeList=isCustomPropertyResult?["bg","border","text"]:[getCssPropType(property)];
        propTypeList.filter(propType=>propType!=="").forEach(propType=>{
            const newValue=csstree.parse("",{context:"value"});
            if(newValue.type==="Value"&&declaration.value.type==="Value"){
                newValue.children.fromArray(declaration.value.children.map(perValue=>handlePerValue(propType, perValue)) );
            }
            
            const newDeclaration=csstree.clone(declaration);
            newDeclaration.value=newValue;
            if(isCustomPropertyResult){
                newDeclaration.property=addCssPrefix(propType,property);
                modified.push(newDeclaration);
            }else if(csstree.generate(newValue)!==oldValue){
                modified.push(newDeclaration);
            }
        });
    }
    return modified;
}

/**
* @param {string} propType 
 * @param {csstree.CssNode} value 
 */
function handlePerValue(propType,value){
    if(propType===""){
        return value;
    }
    switch(value.type){
        case "Hash":{
            return handleHash(propType,value);
        }
        case "Identifier":{
            return handleIdentifier(propType,value);
        }
        case "Function":{
            const functionName=value.name;
            if(functionName==="var"){
                const newNode=csstree.clone(value);
                const collection=[];
                value.children.forEach(c=>{
                    collection.push(handlePerValue(propType,c));
                });
                newNode.children.fromArray(collection);
                return newNode;
            }else if (functionName.startsWith("rgb")){
                return handleColorFunction(propType,value);
            }else if(functionName.startsWith("hsl")){
                return handleColorFunction(propType,value);
            }
        }
    }
    return value;
}

/**
* @param {string} propType 
* @param {csstree.Hash} hash 
*/
function handleHash(propType,hash){
    const newHashValue=handleHexColor(propType,hash.value);
    if(newHashValue){
        const newHash=csstree.clone(hash);
        newHash.value=newHashValue.replace("#","");
        return newHash;
    }else{
        throw new Error("Can not handle hash value",hash.value);
    }
}

/**
* @param {string} propType 
* @param {csstree.Identifier} identifier 
*/
function handleIdentifier(propType,identifier){
    const {name}=identifier;
    if (isCustomProperty(name)){
        const isColorVar=customPropertyStore.get(name);
        if(isColorVar===true){
            const newIdentifier=csstree.clone(identifier);
            newIdentifier.name=addCssPrefix(propType,name);
            return newIdentifier;
        }
        if(isColorVar ===undefined){
            // this var has not been declared
        }
    }
    return identifier;
}

/**
* @param {string} propType 
* @param {csstree.FunctionNode} colorFunctionNode 
*/
function handleColorFunction(propType,colorFunctionNode){
    const colorText=csstree.generate(colorFunctionNode);
    const {name:functionName}=colorFunctionNode;
    let newColorText;
    if(functionName.startsWith("rgb")){
        newColorText=handleRgbColor(propType,colorText);
    }else if(functionName.startsWith("hsl")){
        newColorText=handleHslColor(propType,colorText);
    }
    if(newColorText){
        const newColorFunction=parsePerValue(newColorText);
        if(newColorFunction){
            return newColorFunction;
        }else{
            throw new Error("Can not parse rgb function",newColorText);
        }
    }
    return colorFunctionNode; 
}

/**
  * @param {csstree.StyleSheet} styleSheetAst 
*/
export function handleStyleSheet(styleSheetAst) {
    const newStyleSheetAst=csstree.parse(""); 
    let modifiedRules=[];

    styleSheetAst.children.forEach(c=>{
        if(c.type==="Atrule"||c.type==="Rule"){
            modifiedRules.push(handleRule(c));
        }
    });

    newStyleSheetAst.children.fromArray(modifiedRules.filter(rule=>rule!==undefined&&rule!==null));

    return newStyleSheetAst;
}

/**
* @param {csstree.CssNode} rule 
*/
function handleRule(rule){
    if(rule.type!=="Atrule"&&rule.type!=="Rule") return ;

    if(rule.block){
        let modified=[];
        rule.block.children.forEach(c=>{
            if(c.type==="Atrule"||c.type==="Rule"){
                modified.push(handleRule(c));
            }else if (c.type==="Declaration"){
                modified.push(...handleDeclaration(c)); 
            }
        });
        modified=modified.filter(m=>m!==undefined&&m!==null);
        if(modified.length>0){
            const newRule=csstree.clone(rule);
            const newBlock=csstree.parse("{}",{context:"block"});
            if(newBlock.type==="Block"){
                newBlock.children.fromArray(modified);
            }
            if(newRule.type==="Atrule"||newRule.type==="Rule"){
                newRule.block=newBlock;
            }
            return newRule;
        }
    }
    return null;
}

function getCssRules(style) {
    try {
        const rules = style.sheet?.cssRules;
        if (rules) {
            return rules;
        }
        return null;
    } catch {
        return null;
    }
}

async function getHtmlLinkElementData(linkElement) {
    let url = linkElement.href;

    if (url === "") return "";

    try {
        const data = await loadText(url, location.origin);
        return data??"";
    } catch (err) {
        Logger.err("catch error when loadText", err);
        return "";
    }
}

function getAllInlineStyleElements(element, result = []) {
    if (!(element instanceof Element) && !(element instanceof ShadowRoot)) {
        return result;
    }

    if (element instanceof Element) {
        const style = element.getAttribute("style");
        if (typeof style === "string" && style.length > 0) {
            result.push(element);
        }
    }

    element.querySelectorAll("[style]").forEach(e => result.push(e));
    return result.filter(item=>item instanceof Element && !checkShouldIgnore(classNameToSelectorText(item.className)));
}


async function injectDynamicTheme(target) {
    if (!(target instanceof Node)) {
        return;
    }

    // extract css
    const inlineStyleElements = getAllInlineStyleElements(target).filter(item=>item instanceof Element);
    const cssElements = getStyles(target);

    // parse ast
    const inlineStyleAst=inlineStyleElements.map(el=>{
        let styleText;
        if(originalInlineStyle.has(el)){
            styleText=originalInlineStyle.get(el);
        }else{
            styleText=el.getAttribute("style");
        }
        return {element:el,ast:parseInlineStyle(styleText)};
    });
    const styleSheetAst=(await Promise.all(cssElements.map(el=>extractStyleSheetAst(el)))).map((ast,index)=>({element:cssElements[index],ast}));

    // init custom property store before modify style
    inlineStyleAst.forEach(({ast})=>{
        customPropertyStore.loadFromInlineStyleAst(ast);
    });
    styleSheetAst.forEach(({ast})=>{
        customPropertyStore.loadFromStyleSheetAst(ast);
    });

    // handle inline style elements
    inlineStyleElements.forEach(el => handleInlineStyle(el));

    // handle style element and css external link
    styleSheetAst.forEach(({element,ast})=>{
        if(element instanceof HTMLStyleElement){
            observeStyleElement(element);
        }
        createOrUpdateStyleElement(element,ast);
    });

    await injectInDeep(target);
}

const originalInlineStyle = new Map();

function handleInlineStyle(element) {
    if (!(element instanceof Element)) {
        return;
    }

    if (!originalInlineStyle.has(element)) {
        originalInlineStyle.set(element, element.getAttribute("style"));
    }

    const declarationListAst = parseInlineStyle(originalInlineStyle.get(element));
    const modifiedDeclarations = handleDeclarationList(declarationListAst.children);

    if (modifiedDeclarations.length === 0) {
        originalInlineStyle.delete(element);
        return;
    }

    const newDeclarationList=parseInlineStyle("");
    if(newDeclarationList.type==="DeclarationList"){
        newDeclarationList.children.fromArray(modifiedDeclarations);
    }

    //    if(modifiedDeclarations.length>0){
    //        console.log(originalInlineStyle.get(element));
    //        console.log(csstree.generate(newDeclarationList));
    //    }

    element.setAttribute("style", csstree.generate(newDeclarationList));
}

function getCssText(styleElement) {
    if (!(styleElement instanceof HTMLStyleElement) && !(styleElement instanceof SVGStyleElement)) {
        return "";
    }

    if (styleElement.textContent !== null && styleElement.textContent.trim().length > 0) {
        return styleElement.textContent;
    }

    const cssRules = getCssRules(styleElement);
    if (cssRules === null) return "";
    let cssText = "";
    for (let cssRule of cssRules) {
        cssText += cssRule.cssText;
    }
    return cssText;
}

const relatedStyleMap = new Map();

async function extractStyleSheetAst(cssElement){
    if (!(cssElement instanceof HTMLStyleElement) && !(cssElement instanceof HTMLLinkElement) && !(cssElement instanceof SVGStyleElement)) {
        Logger.err("cssElement must be HTMLStyleElement or HTMLLinkElment or SVGStyleElement but got", cssElement);
        return;
    }

    let cssText;
    if (cssElement instanceof HTMLLinkElement) {
        cssText = await getHtmlLinkElementData(cssElement);
        if(cssText===""){
            cssText=await new Promise(res=>{
                setTimeout(()=>{res(getHtmlLinkElementData(cssElement));},8000);
            });
        }
    } else {
        cssText = getCssText(cssElement);
    }

    return parseCssStyleSheet(cssText); 
}

/**
* @param {Element} cssElement 
* @param {csstree.StyleSheet} styleSheetAst 
*/
function createOrUpdateStyleElement(cssElement,styleSheetAst) {
    const modifiedStyleSheetAst = handleStyleSheet(styleSheetAst);
    const relatedStyleElement = relatedStyleMap.get(cssElement);
    if (relatedStyleElement && relatedStyleElement instanceof HTMLStyleElement) {
        relatedStyleMap.delete(cssElement);
        relatedStyleElement.remove();
    }

    const injectedStyleElem = document.createElement("style");
    injectedStyleElem.classList.add(CLASS_PREFIX);
    injectedStyleElem.media = "screen";
    injectedStyleElem.textContent = csstree.generate(modifiedStyleSheetAst); 
    cssElement.insertAdjacentElement('afterend', injectedStyleElem);
    relatedStyleMap.set(cssElement, injectedStyleElem);
}

function handleAdoptedStyle(docum) {
    if (!(docum instanceof ShadowRoot) && !(docum instanceof Document)) {
        return;
    }

    const styleSheetList = docum.adoptedStyleSheets.filter(s => s._tag !== CLASS_PREFIX);
    const modifiedStyleSheetAstList = styleSheetList
        .map(sheet => handleStyleSheet(parseCssStyleSheet(getStyleSheetText(sheet))));
    const injectedCssStyleSheetList = modifiedStyleSheetAstList.map(modifiedStyleSheetAst => {
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(csstree.generate(modifiedStyleSheetAst));
        styleSheet._tag = CLASS_PREFIX;
        return styleSheet;
    });
    docum.adoptedStyleSheets.push(...injectedCssStyleSheetList);
}


export async function setupDynamicDarkTheme(docum) {
    if (!(docum instanceof Document)) {
        return;
    }

    if (observedRoots.has(document.documentElement)) {
        return;
    }

    observedRoots.add(document.documentElement);

    try {
        injectUserAgentStyle();
        handleAdoptedStyle(docum);
        observe(docum.documentElement);
        await injectDynamicTheme(docum.documentElement);
    } catch (err) {
        Logger.log(err);
    }
}

async function setupDynamicDarkThemeForShadowRoot(shadowRoot) {
    if (!(shadowRoot instanceof ShadowRoot)) {
        return;
    }

    if (observedRoots.has(shadowRoot)) {
        return;
    }

    observedRoots.add(shadowRoot);

    try {
        handleAdoptedStyle(shadowRoot);
        observe(shadowRoot);
        await injectDynamicTheme(shadowRoot);
    } catch (err) {
        Logger.log(err);
    }
}

const observedStyleElement = new Set();

/**
 * @param {HTMLStyleElement} styleElement
 */
function observeStyleElement(styleElement) {
    if (!(styleElement instanceof HTMLStyleElement)) {
        Logger.err("styleElement must be HTMLStyleElement but got", styleElement);
        return;
    }

    if (observedStyleElement.has(styleElement)) {
        return;
    }

    observedStyleElement.add(styleElement);

    const observer = new MutationObserver(() => {
        injectDynamicTheme(styleElement);
    });
    observer.observe(styleElement, { childList: true, characterData: true, subtree: true });
    observers.push(observer);
}

const observedRoots = new Set();
const observers = [];

/**
 * @param {HTMLElement|ShadowRoot} target
*/
function observe(target) {
    const rootObserver = new MutationObserver((mutations) => {
        for (const { type, attributeName, target, addedNodes, removedNodes } of mutations) {
            if (type === "attributes") {
                const { classList } = target;
                if (classList instanceof DOMTokenList && classList.contains(CLASS_PREFIX)) {
                    continue;
                }
                if (attributeName === "disabled") {
                    const relatedStyle = relatedStyleMap.get(target);
                    if (relatedStyle instanceof HTMLStyleElement && typeof target.disabled === "boolean") {
                        relatedStyle.disabled = target.disabled;
                    }
                } else if (attributeName === "rel") {
                    injectDynamicTheme(target);
                }
            }

            if (type === "childList") {
                for (let addedNode of addedNodes) {
                    const { classList } = addedNode;
                    if (classList instanceof DOMTokenList && classList.contains(CLASS_PREFIX)) {
                        continue;
                    }
                    injectDynamicTheme(addedNode);
                }

                for (let removedNode of removedNodes) {
                    const { classList } = removedNode;
                    if (classList instanceof DOMTokenList && classList.contains(CLASS_PREFIX)) {
                        continue;
                    }
                    if (relatedStyleMap.has(removedNode)) {
                        const styleElement = relatedStyleMap.get(removedNode);
                        if (styleElement instanceof HTMLStyleElement) {
                            styleElement.remove();
                        }
                        relatedStyleMap.delete(removedNode);
                    }
                }

            }
        }
    });
    rootObserver.observe(target, { childList: true, subtree: true, attributeFilter: ["rel", "disabled"] });
    observers.push(rootObserver);
}

export function cleanInjectedDarkTheme() {
    relatedStyleMap.forEach((v) => {
        if (v instanceof HTMLStyleElement) {
            v.remove();
        }
    });
    relatedStyleMap.clear();

    observedRoots.forEach(root => {
        if (!(root instanceof ShadowRoot)) {
            root = root.getRootNode();
        }

        // clean all injected style element
        root.querySelectorAll("." + CLASS_PREFIX).forEach(e => e.remove());

        // clean all inserted adopted styleSheet
        root.adoptedStyleSheets.forEach(s => s.cssRules);
        root.adoptedStyleSheets = root.adoptedStyleSheets.filter(s => s._tag !== CLASS_PREFIX);
    });
    observedRoots.clear();

    observers.forEach(o => {
        if (o instanceof MutationObserver) {
            o.disconnect();
        }
    });
    observers.splice(0, observers.length);

    observedStyleElement.clear();

    // clean all inline style
    originalInlineStyle.forEach((v, k) => {
        if (k instanceof Element) {
            k.setAttribute("style", v);
        }
    });
    originalInlineStyle.clear();
}
