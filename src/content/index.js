import { injectBasicStyle } from "./basicStyle";
import { injectEarlyStyle } from "./early";
import { setupDomListener } from "./listener";
import { modifyNavigation } from "./onlyOneTab";
import { modifyVideo } from "./video";

injectBasicStyle();
injectEarlyStyle();

document.addEventListener("DOMContentLoaded", () => {
    // ensure the sync cssom onload
    setupDomListener(document.documentElement);

    modifyVideo();
    modifyNavigation();
});
