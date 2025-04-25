import { injectBasicStyle } from "./basicStyle";
import { setupDomListener } from "./listener";
import { modifyNavigation } from "./onlyOneTab";
import { modifyVideo } from "./video";

injectBasicStyle();

document.addEventListener("DOMContentLoaded", () => {
    // ensure the sync cssom onload
    setupDomListener(document.documentElement);

    const messageBgElme = document.querySelector(".message-bg");
    if (messageBgElme) {
        const style = messageBgElme.getAttribute("style");
        messageBgElme.setAttribute("style", style.replace("light", "dark"));
    }

    modifyVideo();
    modifyNavigation();
});
