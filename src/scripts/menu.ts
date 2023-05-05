import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { NAME, VERSION } from "./tools";
import { createLogoUrl, createBackgroundUrl, createContentRequest } from "./content-tools";

export function createMenu(): tvx.MSXMenuRoot {
    return {
        name: NAME,
        version: VERSION,
        headline: NAME,
        logo: createLogoUrl(),
        logoSize: "small",
        background: createBackgroundUrl(),
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
            icon: "local-movies",
            label: "Alle Shows",
            data: createContentRequest("shows")
        }, {
            icon: "people",
            label: "Alle Bohnen",
            data: createContentRequest("beans")
        }, {
            icon: "search",
            label: "Suche",
            data: createContentRequest("search")
        }, {
            type: "separator"
        }, {
            icon: "settings",
            label: "Einstellungen",
            data: createContentRequest("settings")
        }, {
            type: "separator"
        }, {
            icon: "info",
            label: "Credits",
            data: createContentRequest("credits")
        }]
    };
}