import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { NAME, VERSION, DICTIONARY_URL, appendInteractionRefSuffix, callCallback } from "./tools";
import { createLogoUrl, createBackgroundUrl, createContentRequest, getPinIcon, getPinHint, getBeansCount, getShowsCount } from "./content-tools";
import { getPinnedBeans, getPinnedShows, isShowPinned, isBeanPinned, pinShow, pinBean, unpinShow, unpinBean, movePinnedShow, movePinnedBean } from "./pins";

let validationNumber: number = 0;

function reloadMenu(): void {
    tvx.InteractionPlugin.executeAction("reload:menu");
}

function validateMenu(reload: boolean): void {
    validationNumber++;
    if (reload) {
        reloadMenu();
    }
}

function completeAddedPin(pin: any, context: string, message: string, contentId: string): void {
    if (pin != null) {
        tvx.InteractionPlugin.success(message);
        tvx.InteractionPlugin.executeAction("update:content:" + contentId, {
            icon: getPinIcon(true),
            selection: {
                headline: getPinHint(context, true)
            }
        });
        validateMenu(true);
    }
}

function completeRemovedPin(pin: any, context: string, message: string, contentId: string): void {
    if (pin != null) {
        tvx.InteractionPlugin.success(message);
        tvx.InteractionPlugin.executeAction("update:content:" + contentId, {
            icon: getPinIcon(false),
            selection: {
                headline: getPinHint(context, false)
            }
        });
        tvx.InteractionPlugin.executeAction("update:menu:" + contentId, {
            extensionIcon: "delete",
            options: {}
        });
        validateMenu(false);
    }
}

function completeMovedPin(pin: any): void {
    if (pin != null) {
        validateMenu(true);
    }
}

function completeAddedShow(pin: any): void {
    completeAddedPin(pin, "Lieblingsshow", [
        "Die Show {col:msx-white}'" + pin.title + "'{col} wurde zu deinen Lieblingsshows hinzugefügt.",
        "Du kannst jetzt über das Hauptmenü direkt darauf zugreifen."
    ].join("{br}"), "pin_show_" + pin.id);
}

function completeRemovedShow(pin: any): void {
    completeRemovedPin(pin, "Lieblingsshow", "Die Show {col:msx-white}'" + pin.title + "'{col} wurde von deinen Lieblingsshows entfernt bzw. für die Entfernung vergemerkt.", "pin_show_" + pin.id);
}

function completeAddedBean(pin: any): void {
    completeAddedPin(pin, "Lieblingsbohne", [
        "Die Bohne {col:msx-white}'" + pin.name + "'{col} wurde zu deinen Lieblingsbohnen hinzugefügt.",
        "Du kannst jetzt über das Hauptmenü direkt darauf zugreifen."
    ].join("{br}"), "pin_bean_" + pin.id);
}

function completeRemovedBean(pin: any): void {
    completeRemovedPin(pin, "Lieblingsbohne", "Die Bohne {col:msx-white}'" + pin.name + "'{col} wurde von deinen Lieblingsbohnen entfernt bzw. für die Entfernung vergemerkt.", "pin_bean_" + pin.id);
}

function togglePin(action: string): void {
    if (tvx.Tools.isFullStr(action)) {
        if (action.indexOf("show:") == 0) {
            let showId: string = action.substring(5);
            if (isShowPinned(showId)) {
                completeRemovedShow(unpinShow(showId));
            } else {
                pinShow(showId, (pin: any) => {
                    completeAddedShow(pin);
                });
            }
        } else if (action.indexOf("bean:") == 0) {
            let beanId: string = action.substring(5);
            if (isBeanPinned(beanId)) {
                completeRemovedBean(unpinBean(beanId));
            } else {
                pinBean(beanId, (pin: any) => {
                    completeAddedBean(pin);
                });
            }
        } else {
            tvx.InteractionPlugin.warn("Unknown pin toggle action: '" + action + "'");
        }
    } else {
        tvx.InteractionPlugin.warn("Empty pin toggle action");
    }
}

function addPin(action: string): void {
    if (tvx.Tools.isFullStr(action)) {
        if (action.indexOf("show:") == 0) {
            pinShow(action.substring(5), (pin: any) => {
                completeAddedShow(pin);
            });
        } else if (action.indexOf("bean:") == 0) {
            pinBean(action.substring(5), (pin: any) => {
                completeAddedBean(pin);
            });
        } else {
            tvx.InteractionPlugin.warn("Unknown pin add action: '" + action + "'");
        }
    } else {
        tvx.InteractionPlugin.warn("Empty pin add action");
    }
}

function movePin(action: string): void {
    if (tvx.Tools.isFullStr(action)) {
        if (action.indexOf("show:") == 0 || action.indexOf("bean:") == 0) {
            let moveIdAndDirection: string = action.substring(5);
            let moveSeparator: number = moveIdAndDirection.indexOf(":");
            if (moveSeparator > 0) {
                let moveId: string = moveIdAndDirection.substring(0, moveSeparator);
                let moveDirection: string = moveIdAndDirection.substring(moveSeparator + 1);
                if (action.indexOf("show:") == 0) {
                    completeMovedPin(movePinnedShow(moveId, moveDirection));
                } else {
                    completeMovedPin(movePinnedBean(moveId, moveDirection));
                }
            } else {
                tvx.InteractionPlugin.warn("Invalid pin move action: '" + action + "'");
            }
        } else {
            tvx.InteractionPlugin.warn("Unknown pin move action: '" + action + "'");
        }
    } else {
        tvx.InteractionPlugin.warn("Empty pin move action");
    }
}

function removePin(action: string): void {
    if (tvx.Tools.isFullStr(action)) {
        if (action.indexOf("show:") == 0) {
            completeRemovedShow(unpinShow(action.substring(5)));
        } else if (action.indexOf("bean:") == 0) {
            completeRemovedBean(unpinBean(action.substring(5)));
        } else {
            tvx.InteractionPlugin.warn("Unknown pin remove action: '" + action + "'");
        }
    } else {
        tvx.InteractionPlugin.warn("Empty pin remove action");
    }
}

function createPinOptions(headline: string, context: string, contentId: string, pinId: string, total: number): tvx.MSXContentRoot {
    return {
        headline: headline,
        ready: createMenuValidation(),
        flag: "pin_options",
        refocus: true,
        template: {
            enumerate: false,
            layout: "0,0,8,1",
            type: "control"
        },
        items: [{
            display: total > 1,
            icon: "vertical-align-top",
            label: context + " an den Anfang der Liste setzen",
            action: "interaction:commit:message:menu:pin:move:" + contentId + ":" + pinId + ":start"
        }, {
            display: total > 1,
            icon: "arrow-upward",
            label: context + " eine Position nach oben setzen",
            action: "interaction:commit:message:menu:pin:move:" + contentId + ":" + pinId + ":up"
        }, {
            display: total > 1,
            icon: "arrow-downward",
            label: context + " eine Position nach unten setzen",
            action: "interaction:commit:message:menu:pin:move:" + contentId + ":" + pinId + ":down"
        }, {
            display: total > 1,
            icon: "vertical-align-bottom",
            label: context + " an das Ende der Liste setzen",
            action: "interaction:commit:message:menu:pin:move:" + contentId + ":" + pinId + ":end"
        }, {
            icon: "delete",
            label: context + " aus der Liste entfernen",
            action: "[cleanup|interaction:commit:message:menu:pin:remove:" + contentId + ":" + pinId + "]"
        }]
    };
}

function addPinnedShows(menu: tvx.MSXMenuItem[], pinnedShows: any): void {
    if (menu != null && pinnedShows != null && pinnedShows.length > 0) {
        menu.push({
            type: "separator",
            label: "Lieblingsshows (" + getShowsCount(pinnedShows.length) + ")"
        });
        for (let i: number = 0; i < pinnedShows.length; i++) {
            let pin: any = pinnedShows[i];
            menu.push({
                id: "pin_show_" + pin.id,
                icon: "local-movies",
                extensionIcon: "blank",
                label: pin.title,
                data: createContentRequest("show:" + pin.id),
                options: createPinOptions(pin.title, "Show", "show", pin.id, pinnedShows.length)
            });
        }
    }
}

function addPinnedBeans(menu: tvx.MSXMenuItem[], pinnedBeans: any): void {
    if (menu != null && pinnedBeans != null && pinnedBeans.length > 0) {
        menu.push({
            type: "separator",
            label: "Lieblingsbohnen (" + getBeansCount(pinnedBeans.length) + ")"
        });
        for (let i: number = 0; i < pinnedBeans.length; i++) {
            let pin: any = pinnedBeans[i];
            menu.push({
                id: "pin_bean_" + pin.id,
                icon: "person",
                extensionIcon: "blank",
                label: pin.name,
                data: createContentRequest("bean:" + pin.id),
                options: createPinOptions(pin.name, "Bohne", "bean", pin.id, pinnedBeans.length)
            });
        }
    }
}

function createMenuReference(): string {
    return appendInteractionRefSuffix("request:interaction:init");
}

function createMenuValidation(): tvx.MSXReady {
    return {
        action: "interaction:commit:message:menu:validate:" + validationNumber
    };
}

function createMenu(pinnedShows: any, pinnedBeans: any): tvx.MSXMenuRoot {
    let menu: tvx.MSXMenuItem[] = [{
        type: "separator",
        label: "Mediathek"
    }, {
        icon: "home",
        label: "Übersicht",
        data: createContentRequest("overview")
    }, {
        display: false,
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
        icon: "history",
        label: "Verlauf",
        data: createContentRequest("history")
    }];
    addPinnedShows(menu, pinnedShows);
    addPinnedBeans(menu, pinnedBeans);
    menu.push({
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
    });
    return {
        cache: false,
        name: NAME,
        version: VERSION,
        headline: NAME,
        dictionary: DICTIONARY_URL,
        logo: createLogoUrl(),
        logoSize: "small",
        background: createBackgroundUrl(),
        style: "flat-separator",
        reference: createMenuReference(),
        ready: createMenuValidation(),
        menu: menu
    };
}

export function loadMenu(callback: (data: any) => void): void {
    callCallback(createMenu(getPinnedShows(), getPinnedBeans()), callback);
}

export function executeMenu(action: string): void {
    if (tvx.Tools.isFullStr(action)) {
        if (action.indexOf("validate:") == 0) {
            if (validationNumber != tvx.Tools.strToNum(action.substring(9), -1)) {
                reloadMenu();
            }
        } else if (action.indexOf("pin:") == 0) {
            let pinAction: string = action.substring(4);
            if (pinAction.indexOf("toggle:") == 0) {
                togglePin(pinAction.substring(7));
            } else if (pinAction.indexOf("add:") == 0) {
                addPin(pinAction.substring(4));
            } else if (pinAction.indexOf("move:") == 0) {
                movePin(pinAction.substring(5));
            } else if (pinAction.indexOf("remove:") == 0) {
                removePin(pinAction.substring(7));
            } else {
                tvx.InteractionPlugin.warn("Unknown pin action: '" + pinAction + "'");
            }
        } else {
            tvx.InteractionPlugin.warn("Unknown menu action: '" + action + "'");
        }
    } else {
        tvx.InteractionPlugin.warn("Empty menu action");
    }
}