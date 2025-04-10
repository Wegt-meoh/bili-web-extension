import { setupListener } from "./listener";
import { modifyNavigation } from "./onlyOneTab";
import { modifyVideo } from "./video";

window.onload = () => {
    setupListener();
    modifyVideo();
    modifyNavigation();
}
