import { injectBasicStyle } from "./basicStyle";
import { injectDynamicTheme } from "./dynamicTheme";
import { setupListener } from "./listener";
import { modifyNavigation } from "./onlyOneTab";
import { modifyVideo } from "./video";

setupListener();
//injectDynamicTheme();
modifyVideo();
modifyNavigation();
injectBasicStyle();
