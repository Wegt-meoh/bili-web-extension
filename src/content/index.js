import { injectBasicStyle } from "./basicStyle";
import { setupDomListener } from "./listener";
import { modifyNavigation } from "./onlyOneTab";
import { modifyVideo } from "./video";

injectBasicStyle();

window.onload = () => {
    setupDomListener(document.documentElement);
    modifyVideo();
    modifyNavigation();
};
