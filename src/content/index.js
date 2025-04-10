import { injectBasicStyle } from "./basicStyle";
import { injectEarlyStyle } from "./early";
import { setupListener } from "./listener";
import { modifyNavigation } from "./onlyOneTab";
import { modifyVideo } from "./video";

injectEarlyStyle();
injectBasicStyle();

window.onload = () => {
    setupListener();
    modifyVideo();
    modifyNavigation();
};
