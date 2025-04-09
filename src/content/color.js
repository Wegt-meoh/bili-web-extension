export function extractRGB(color) {
    const match = color.match(/[\d.]+/g);
    return match ? match.map(parseFloat) : null;
}

export function extractHSL(color) {
    if (typeof color !== "string") {
        throw new TypeError("color must be string");
    }
    const matchResult = color.match(/[\d.]+%?/g);
    if (!matchResult) {
        throw new Error("can not extract hsl from color: " + color);
    };
    return matchResult.map(v => {
        if (v.includes("%")) {
            return parseFloat(v) / 100;
        }
        return parseFloat(v);
    });
}

export function hslToString(h, s, l, a) {
    return `hsl${a !== undefined ? 'a' : ''}(${h}, ${s * 100}%, ${l * 100}%${a !== undefined ? `, ${a}` : ''})`;
}

export function extractRgbFromHex(hex) {
    // Remove the "#" if present
    hex = hex.replace(/^#/, "");

    // Parse different hex formats
    let r, g, b, a;
    if (hex.length === 3) {
        // Short format (e.g., #f80 → #ff8800)
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        // Full format (e.g., #ff5733)
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else if (hex.length === 8) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
        a = parseInt(hex.substring(6, 8), 16) / 255;
        return [r, g, b, a];
    } else {
        throw new Error("Invalid hex color format");
    }

    return [r, g, b]; // Returns an array [r, g, b]
}

export function rgbToHexText(r, g, b, a) {
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${a !== undefined ? Math.round(a * 255).toString(16).padStart(2, "0") : ""}`;
}

export function rgbToText(r, g, b, a) {
    return `rgb${a !== undefined ? 'a' : ''}(${r}, ${g}, ${b}${a !== undefined ? `, ${a}` : ''})`;
}

export function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
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
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function invertHslColor(h, s, l, a) {
    if (1 - l < 0.12) {
        let [r, g, b] = hslToRgb(h, s, 1 - l);
        let [i_h, i_s, i_l] = rgbToHsl(r + 24, g + 26, b + 27);
        if (a !== undefined) {
            return [i_h, i_s, i_l, a];
        }
        return [i_h, i_s, i_l];
    }

    if (a !== undefined) {
        return [h, s, 1 - l, a];
    }
    return [h, s, 1 - l];
}

export function invertRgbColor(r, g, b, a) {
    let [h, s, l] = rgbToHsl(r, g, b);
    return [...hslToRgb(...invertHslColor(h, s, l)), a];
}

export function isDarkColor(r, g, b) {
    // eslint-disable-next-line no-unused-vars
    const [h, s, l] = rgbToHsl(r, g, b);
    if (l < 0.5) {
        return true;
    }

    return false;
}
