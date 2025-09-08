import { CLASS_PREFIX, defaultDarkColor } from "./const";
import { insertHeadStyle } from "./utils";
const USER_ANGENT_STYLE = `
@layer{
    html,body{
        color: ${defaultDarkColor.text};
        background-color: ${defaultDarkColor.bg};
        border-color: ${defaultDarkColor.border};
    }
   
    html,iframe{
        color-scheme: dark !important; 
    }
}
`;

export function injectUserAgentStyle() {
    insertHeadStyle(USER_ANGENT_STYLE, "start", CLASS_PREFIX + "-user-agent");
}
