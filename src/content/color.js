import { parse } from "culori";

export function extractRGB(color) {
    const rgb=parse(color);
    if (rgb){
        return [rgb.r,rgb.g,rgb.b,rgb.a];
    }else{
        return undefined;
    }
}

export function extractHSL(color) {
    const hsl=parse(color);
    if(hsl){
        return [hsl.h,hsl.s,hsl.l,hsl.a];
    }else{
        return undefined;
    }
}

export function hslToText(h, s, l, a=1) {
    return `hsl(${h} ${s * 100}% ${l * 100}%${a !== 1? `/ ${a}` : ''})`;
}

export function extractRgbFromHex(hex) {
    // Remove the "#" if present
    hex = hex.replace(/^#/, "");

    // Parse different hex formats
    let r, g, b, a=255;
    if (hex.length === 3) {
        // Short format (e.g., #f80 → #ff8800)
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 4) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
        a = parseInt(hex[3] + hex[3], 16) ;
    } else if (hex.length === 6) {
        // Full format (e.g., #ff5733)
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length === 8) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
        a = parseInt(hex.substring(6, 8), 16) ;
    } else {
        return undefined;
    }

    return [r/255, g/255, b/255,a/255]; 
}

export function rgbToHexText(r, g, b, a=1) {
    r=Math.round(r*255);
    g=Math.round(g*255);
    b=Math.round(b*255);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${a !== 1? Math.round(a * 255).toString(16).padStart(2, "0") : ""}`;
}

export function rgbToText(r, g, b, a=1) {
    return `rgb(${Math.round(r*255)} ${Math.round(g*255)} ${Math.round(b*255)} ${a!==1?`/ ${a}`:""})`;
}
/**
* @param {number} r 0-1
* @param {number} g 0-1
* @param {number} b 0-1 
*/
export function rgbToHsl(r, g, b) {
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }
    return [h, s, l];
}

export function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        h /= 360;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r,g,b]; 
}

export function invertHslColor(h, s, l, a) {
    // color is too light invert it
    if (1 - l < 0.12) {
        let [r, g, b] = hslToRgb(h, s, 1 - l);
        let [i_h, i_s, i_l] = rgbToHsl(r + 24/255, g + 26/255, b + 27/255);
        return [i_h, i_s, i_l, a];
    }

    // no need invert
    return [h, s, 1 - l, a];
}

export function invertRgbColor(r, g, b) {
    let [h, s, l] = rgbToHsl(r, g, b);
    return [...hslToRgb(...invertHslColor(h, s, l))];
}


/**
* @param {number} l 0-1 
*/
export function isDarkColor(l) {
    if (l < 0.5) {
        return true;
    }

    return false;
}
