import { injectBasicStyle } from "./basicStyle";
import { injectEarlyStyle } from "./early";
import { setupDomListener } from "./listener";
import { modifyNavigation } from "./onlyOneTab";

injectBasicStyle();
injectEarlyStyle();

document.addEventListener("DOMContentLoaded", () => {
    // ensure the sync cssom onload
    setupDomListener(document.documentElement);

    modifyNavigation();
});
