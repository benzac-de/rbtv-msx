import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { getImageUrl, appendKeepRatioSuffix, NAME } from "./tools";
import { createContentRequest } from "./content-tools";

export function createMenu(): tvx.MSXMenuRoot {
    return {
        headline: NAME,
        logo: getImageUrl("logo"),
        logoSize: "small",
        background: appendKeepRatioSuffix(getImageUrl("background")),
        style: "flat-separator",
        menu: [{
            type: "separator",
            label: "Mediathek"
        }, {
            icon: "home",
            label: "Übersicht",
            data: createContentRequest("overview")
        }, {
            icon: "new-releases",
            label: "Neue Videos",
            data: createContentRequest("new")
        }, {
            display: false,
            icon: "event",
            label: "Zukünftige Videos",
            data: createContentRequest("schedule")
        }, {
            display: false,
            icon: "recent-actors",
            label: "Team Rocket Beans",
            data: createContentRequest("team")
        }, {
            icon: "local-movies",
            label: "Alle Shows",
            data: createContentRequest("shows")
        }, {
            display: false,
            icon: "mic",
            label: "Podcasts",
            data: createContentRequest("podcasts")
        }, {
            icon: "people",
            label: "Bohnen",
            data: createContentRequest("beans")
        }, {
            type: "separator"
        }, {
            icon: "info",
            label: "Credits",
            data: createContentRequest("credits")
        }]
    };
}