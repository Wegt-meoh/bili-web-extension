export const CLASS_PREFIX = "dark-bili";
export const STYLE_SELECTOR = `style:not([class*='${CLASS_PREFIX}']):not([data-injector='danmaku-x']), link[rel*='stylesheet' i]:not([disabled]), link[as*='style' i]:not([disabled])`;
export const COLOR_KEYWORDS = new Set([
    "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black",
    "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse",
    "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan",
    "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki", "darkmagenta", "darkolivegreen",
    "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray",
    "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey",
    "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite",
    "gold", "goldenrod", "gray", "green", "greenyellow", "grey", "honeydew", "hotpink", "indianred",
    "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue",
    "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey", "lightpink",
    "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightslategrey", "lightsteelblue",
    "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue",
    "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen",
    "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin",
    "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod",
    "palegreen", "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum",
    "powderblue", "purple", "rebeccapurple", "red", "rosybrown", "royalblue", "saddlebrown", "salmon",
    "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue", "slateblue", "slategray",
    "slategrey", "snow", "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise",
    "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen",

    // 特殊功能色
    "transparent", "currentColor", "inherit", "initial", "unset"
]);
export const IGNORE_SELECTOR = [".pswp", ".bpx-player-volume-hint", ".vertical-slider-wrap.svelte-crc1ty .slider-rail.svelte-crc1ty", ".vertical-slider-wrap.svelte-crc1ty .slider-handle.svelte-crc1ty", ".vertical-slider-wrap.svelte-crc1ty .slider-track.svelte-crc1ty"];
export const PSEUDO_CLASSES = /:(?:hover|active|focus|visited|link|target|checked|disabled|enabled|required|optional|valid|invalid|in-range|out-of-range|read-only|read-write|first-child|last-child|only-child|nth-child\([^)]+\)|nth-last-child\([^)]+\)|first-of-type|last-of-type|only-of-type|nth-of-type\([^)]+\)|nth-last-of-type\([^)]+\)|empty|not\([^)]+\)|lang\([^)]+\)|root|scope|where\([^)]+\)|is\([^)]+\)|has\([^)]+\)|dir\([^)]+\)|default|indeterminate|placeholder-shown|autofill|playing|paused|current|past|future|fullscreen|modal|picture-in-picture|user-valid|user-invalid)(?![^\s{]*[^{])/gi;
export const PSEUDO_ELEMENT = /::(?:after|before|first-letter|first-line|selection|backdrop|marker|placeholder|cue|part\([^)]+\)|slotted\([^)]+\)|grammar-error|spelling-error)(?![^\s{]*[^{])/gi;
export const defaultDarkColor = {
    bg: "rgb(24,26,27)",
    border: "rgb(24,26,27)",
    text: "rgb(255,255,255)"
};
