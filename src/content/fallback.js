import { defaultDarkColor } from "./const";
import { insertHeadStyle } from "./utils";
const FALLBACK_STYLE = `
input,textarea,body{
    color: ${defaultDarkColor.text};
    background-color: ${defaultDarkColor.bg};
    border-color: ${defaultDarkColor.border};
}
`;

export function injectFallbackStyle() {
    insertHeadStyle(FALLBACK_STYLE, "start");
}
