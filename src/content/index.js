import { injectBasicStyle } from "./basicStyle";
import { setupListener } from "./listener";
import { modifyNavigation } from "./onlyOneTab";
import { modifyVideo } from "./video";

injectBasicStyle();

window.onload = () => {
    setupListener(document.documentElement);
    modifyVideo();
    modifyNavigation();
};
