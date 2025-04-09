import { injectBasicStyle } from "./basicStyle";
import { setupListener } from "./listener";
import { modifyNavigation } from "./onlyOneTab";
import { modifyVideo } from "./video";

setupListener();
modifyVideo();
modifyNavigation();
injectBasicStyle();
