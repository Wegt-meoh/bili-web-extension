const SESSION_STORAGE_KEY_PREFIX_CSS_CACHE = "__dark_bili_css_cache";
import * as csstree from "css-tree";
import { extractCustomPropertyFromValue, isColorRelatedValue, isCustomProperty } from "./utils";

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

    /**
    * @param {csstree.Declaration} ast 
    */
    loadFromInlineStyleAst(ast){
        csstree.walk(ast,(node)=>{
            if(node.type==="Declaration"&&isCustomProperty(node.property)){
                const {property,value}=node;
                console.log(property,node.value.type,csstree.generate(node.value));
                const propertyList=extractCustomPropertyFromValue(value);
                console.log(propertyList);
                if(propertyList.length>0){
                    this.insert(property,propertyList);
                }{
                    this.insert(property,isColorRelatedValue(value));
                }
                return csstree.walk.skip;
            }
        });
    }

    /**
    * @param {csstree.StyleSheet} ast 
    */
    loadFromStyleSheetAst(ast){
        this.loadFromInlineStyleAst(ast);
    }

    insert(name, value){
        // although there are two properties has same name
        // the propType of them are assumed to be same
        this.storage.set(name,value);
    }

    get(name){
        // --bg1: [--Ga1,--size1] -> --Ga1: [--Ca1], --size1: false -> --Ca1: true -> return true;
        const stack=[name];
        do{
            let result=this.storage.get(stack.pop());
            if(Array.isArray(result)){
                stack.push(...result);
            }else{
                if(result===true){
                    this.storage.set(name,true);
                    return true;
                }
            }
        }while(stack.length>0);
        return false;
    }
}
