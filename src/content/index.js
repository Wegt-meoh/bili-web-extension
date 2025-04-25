import { injectBasicStyle } from "./basicStyle";
import { injectEarlyStyle } from "./early";
import { setupDomListener } from "./listener";
import { modifyNavigation } from "./onlyOneTab";
import { modifyVideo } from "./video";

injectBasicStyle();
injectEarlyStyle();

document.addEventListener("DOMContentLoaded", () => {
    // ensure the sync cssom onload
    const messageBgElme = document.querySelector(".message-bg");
    if (messageBgElme) {
        const style = messageBgElme.getAttribute("style");
        messageBgElme.setAttribute("style", style.replace("light", "dark"));
    }
    setupDomListener(document.documentElement);

    modifyVideo();
    modifyNavigation();
});
