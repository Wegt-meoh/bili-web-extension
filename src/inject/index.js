import { injectBasicStyle } from "./basicStyle";
import { injectDynamicTheme } from "./dynamicTheme";
import { modifyNavigation } from "./onlyOneTab";
import { modifyVideo } from "./video";


injectDynamicTheme();
modifyVideo();
modifyNavigation();
injectBasicStyle();
