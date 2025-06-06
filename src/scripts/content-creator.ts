import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { SETTINGS, EVENT_SHOW_ID, NAME, VERSION, MIN_APP_VERSION, proxyImageForLocalContext } from "./tools";
import { isShowPinned, isBeanPinned } from "./pins";
import { hasHistory } from "./history";
import {
    EXTENDED_SHOW_DESCRIPTION_LENGHT,
    addTextPrefix,
    createBackgroundUrl,
    createContentRequest,
    createDescriptionFromHTML,
    createEpisodeAction,
    createHeaderUrl,
    createPlaceholderUrl,
    createSettingsToggleAction,
    createShadowUrl,
    getBeanFullName,
    getBeanName,
    getBeanRole,
    getBeansCount,
    getBeansOrderLabel,
    getBeanVideosCount,
    getDuration,
    getEpisodeFooter,
    getEpisodeHeader,
    getEpisodesCount,
    getEpisodesOrderLabel,
    getEpisodesSeasonLabel,
    getImage,
    getListNumber,
    getLiveDuration,
    getPinHint,
    getPinIcon,
    getPinTag,
    getPotrait,
    getReleaseTimestamp,
    getSearchCount,
    getSeasonsCount,
    getSettingsToggleIcon,
    getShowDescription,
    getShowFooter,
    getShowHeadline,
    getShowName,
    getShowreelAction,
    getShowreelOptionsAction,
    getShowsCount,
    getShowsFilterLabel,
    getShowsOrderLabel,
    getShowTitle,
    getThumbnail,
    getTokenColor,
    getTokenType,
    getTotalItems,
    getVideoDuration,
    getVideosCount,
    getVideoTitle,
    getYouTubeQualityLabel
} from "./content-tools";

function completeError(error: string): string {
    if (tvx.Tools.isFullStr(error)) {
        if (error.lastIndexOf(".") != error.length - 1) {
            return error + ".";
        }
        return error;
    }
    return "";
}

function createListLiveExtension(item: any, index: number, length: number, extensionPage: boolean, contentId: string): tvx.MSXLive {
    //Note: Return an empty live object for an extension page to override a possible template live object
    return item != null && index == length - 1 ? {
        type: "setup",
        action: "interaction:commit:message:content:extend:" + contentId
    } : (extensionPage ? {} : null);
}

function createListOptions(goToTopOption: boolean): tvx.MSXContentRoot {
    return {
        headline: "Optionen",
        flag: "list_options",
        refocus: true,
        template: {
            enumerate: false,
            layout: "0,0,8,1",
            type: "control"
        },
        items: goToTopOption ? [{
            icon: "vertical-align-top",
            label: "Zum Anfang der Liste",
            action: "[cleanup|focus:index:-1]"
        }] : []
    };
}

function createEpisodeListOptions(goToTopOption: boolean, item: any): tvx.MSXContentRoot {
    let options: tvx.MSXContentRoot = createListOptions(goToTopOption);
    if (item != null) {
        options.items.push({
            icon: "add-circle",
            label: "Video zum Verlauf hinzufügen",
            action: "[cleanup|interaction:commit:message:content:history:add:" + item.id + "]",
            data: {
                title: getVideoTitle(item),
                image: getThumbnail(item, "small"),
                token: getTokenType(item),
                show: getShowName(item),
                release: getReleaseTimestamp(item),
                duration: getVideoDuration(item)
            }
        });
    }
    return options;
}

function createHistoryListOptions(goToTopOption: boolean): tvx.MSXContentRoot {
    let options: tvx.MSXContentRoot = createListOptions(goToTopOption);
    options.items.push({
        icon: "delete",
        label: "Video aus dem Verlauf entfernen",
        action: "[cleanup|interaction:commit:message:content:history:remove:{context:id}]"
    });
    return options;
}

function createListSelection(context: string, total: number): tvx.MSXSelection {
    return {
        headline: addTextPrefix(context, "{context:number}/" + total, " "),
        action: "interaction:commit:message:backdrop:reduce"
    };
}

function createItemSelection(context: string, index: number, total: number): tvx.MSXSelection {
    return {
        headline: addTextPrefix(context, (index + 1) + "/" + total, " "),
        action: "interaction:commit:message:backdrop:reduce"
    };
}

function createBackdrop(url: string): tvx.MSXReady {
    return {
        action: "interaction:commit:message:backdrop:" + tvx.Tools.strFullCheck(url, "none")
    };
}

function createEpisodesOrderItem(flag: string, currentOrder: string, activeOrder: string, contentId: string, seasonId: string, showRelated: boolean): tvx.MSXContentItem {
    var active = currentOrder == activeOrder;
    return {
        focus: active,
        label: getEpisodesOrderLabel(currentOrder, showRelated),
        extensionIcon: active ? "check" : "blank",
        action: active ? "back" : "[back|invalidate:content|replace:content:" + flag + ":" + createContentRequest(contentId + ":" + tvx.Tools.strFullCheck(seasonId, "") + ":" + currentOrder) + "]"
    };
}

function createEpisodesOrderPanel(flag: string, order: string, contentId: string, seasonId: string, showRelated: boolean): tvx.MSXContentRoot {
    return {
        headline: "Sortierung",
        template: {
            enumerate: false,
            type: "control",
            layout: "0,0,8,1"
        },
        items: [
            createEpisodesOrderItem(flag, "default", order, contentId, seasonId, showRelated),
            createEpisodesOrderItem(flag, "reverse", order, contentId, seasonId, showRelated)
        ]
    };
}

function getActiveSeason(seasonId: string, seasons: any): any {
    let seasonNumber = tvx.Tools.strToNum(seasonId, -1);
    if (seasonNumber >= 0 && seasons != null && seasons.length > 0) {
        for (let i: number = 0; i < seasons.length; i++) {
            let item: any = seasons[i];
            if (seasonNumber === item.id) {
                return item;
            }
        }
    }
    return null;
}

function createEpisodesSeasonItem(flag: string, index: number, total: number, currentSeason: any, activeSeason: any, contentId: string, order: string): tvx.MSXContentItem {
    var active = (currentSeason == null && activeSeason == null) || (currentSeason != null && activeSeason != null && currentSeason.id === activeSeason.id);
    return {
        focus: active,
        label: getEpisodesSeasonLabel(currentSeason, true),
        extensionIcon: active ? "check" : "blank",
        selection: index >= 0 ? createItemSelection("Staffel", index, total) : null,
        action: active ? "back" : "[back|invalidate:content|replace:content:" + flag + ":" + createContentRequest(contentId + ":" + (currentSeason != null ? currentSeason.id : "") + ":" + order) + "]"
    };
}

function createEpisodesSeasonPanelHeader(flag: string, activeSeason: any, total: number, contentId: string, order: string, compress: boolean): tvx.MSXContentPage {
    let allEpisodesItem: tvx.MSXContentItem = createEpisodesSeasonItem(flag, -1, -1, null, activeSeason, contentId, order);
    allEpisodesItem.type = "control";
    allEpisodesItem.layout = compress ? "0,0,10,1" : "0,0,8,1";
    allEpisodesItem.offset = compress ? "0,0,0,0.333" : null;
    return {
        compress: false,
        offset: compress ? "0,0,0,1" : "0,0,0,0.5",
        items: [allEpisodesItem, {
            display: total > 0,
            type: "space",
            layout: compress ? "1,0,9,1" : "1,0,7,1",
            offset: compress ? "-1,1.37,1,0" : "-1,1.03,1,0",
            text: getSeasonsCount(total)
        }]
    };
}

function createEpisodesSeasonPanel(flag: string, activeSeason: any, seasons: any, contentId: string, order: string): tvx.MSXContentRoot {
    let items: tvx.MSXContentItem[] = [];
    let total: number = seasons != null ? seasons.length : -1;
    if (total > 0) {
        for (let i: number = 0; i < total; i++) {
            items.push(createEpisodesSeasonItem(flag, i, total, seasons[i], activeSeason, contentId, order));
        }
    }
    let compress: boolean = total > 6;
    return {
        compress: compress,
        headline: "Folgenauswahl",
        template: {
            enumerate: false,
            type: "control",
            layout: compress ? "0,0,10,1" : "0,0,8,1"
        },
        header: createEpisodesSeasonPanelHeader(flag, activeSeason, total, contentId, order, compress),
        items: items
    };
}

function createEpisodeTemplate(context: string, data: any, pagination: any, historyItems: boolean): tvx.MSXContentItem {
    return {
        type: "default",
        layout: "0,0,3,3",
        imageHeight: SETTINGS.longTitles ? 1.5 : 1.6,
        imageBoundary: true,
        wrapperColor: "msx-black",
        truncation: "titleHeader|titleFooter",
        enumerate: false,
        stampColor: "rgba(0,0,0,0.8)",
        progressBackColor: "rgba(255,255,255,0.25)",
        selection: createListSelection(context, getTotalItems(data, pagination)),
        options: historyItems ? createHistoryListOptions(true) : createListOptions(true),
        imageFiller: "height-center",
        progress: -1,
        live: {
            type: "playback",
            action: "player:show",
            stamp: "{context:stamp}",
            running: {
                stamp: "{context:liveStamp}"
            }
        },
        properties: {
            "resume:key": "url"
        }
    };
}

function createEpisodeItems(data: any, extendable: boolean, contentId: string, historyItems: boolean): tvx.MSXContentItem[] {
    let items: tvx.MSXContentItem[] = [];
    let timestamp: number = tvx.DateTools.getTimestamp();
    if (data != null && data.length > 0) {
        for (let i: number = 0; i < data.length; i++) {
            let item: any = data[i];
            let extensionPage: boolean = extendable === true && data.length - i <= 8;
            let preloadPage: boolean = item.preload === true && item.preloadOffset >= 8 && item.preloadOffset < 16;
            if (item.preload === true) {
                item.preload = false;
            }
            items.push({
                id: "episode" + i + "_" + item.id,
                number: getListNumber(i),
                titleHeader: getEpisodeHeader(item),
                titleFooter: getEpisodeFooter(item, timestamp),
                image: extensionPage ? null : tvx.Tools.strFullCheck(getThumbnail(item, "small"), createPlaceholderUrl()),
                icon: extensionPage ? "msx-white-soft:more-horiz" : null,
                stamp: getDuration(item),
                liveStamp: getLiveDuration(item),
                progressColor: getTokenColor(item),
                imagePreload: preloadPage,
                live: extendable === true ? createListLiveExtension(item, i, data.length, extensionPage, contentId) : null,
                action: createEpisodeAction(item, false),
                options: historyItems ? null : createEpisodeListOptions(true, item)
            });
        }
    }
    return items;
}

function createHistoryClearPanel(): tvx.MSXContentRoot {
    return {
        headline: "Verlauf zurücksetzen",
        pages: [{
            items: [{
                type: "space",
                layout: "0,0,8,5",
                text: [
                    "Möchtest du den Verlauf der zuletzt angesehenen Videos zurücksetzen?{br}{br}",
                    "{ico:msx-blue:info} Beim Zurücksetzen des Verlaufs bleibt der individuelle Fortschritt der Videos erhalten.",
                    " Es ist also weiterhin möglich, ein Video ab der letzten Position fortzusetzen."
                ]
            }, {
                type: "button",
                layout: "0,5,4,1",
                label: "Ja",
                action: "[back|interaction:commit:message:content:history:clear]"
            }, {
                type: "button",
                layout: "4,5,4,1",
                label: "Nein",
                action: "back"
            }]
        }]
    };
}

function createHistoryHeader(data: any): tvx.MSXContentPage {
    return {
        offset: "0,0,0,0.5",
        items: [{
            type: "control",
            layout: "0,0,12,1",
            icon: "delete",
            label: "Verlauf zurücksetzen",
            action: hasHistory() ? "panel:data" : "info:Der Verlauf ist bereits leer und kann nicht zurückgesetzt werden.",
            data: createHistoryClearPanel()
        }, {
            type: "space",
            layout: "1,0,11,1",
            offset: "-1,1.03,1,0",
            text: getVideosCount(getTotalItems(data, null))
        }]
    };
}

function createShowAction(item: any): string {
    if (item != null && tvx.Tools.isNum(item.id)) {
        if (item.isTruePodcast === true) {
            return "info:Diese Show ist nur als Podcast verfügbar und kann zur Zeit nicht über das " + NAME + " Portal wiedergegeben werden.";
        } else {
            return "content:" + createContentRequest("show:" + item.id);
        }
    }
    return null;
}

function createShowTemplate(data: any, pagination: any): tvx.MSXContentItem {
    return {
        type: "separate",
        layout: "0,0,2,4",
        enumerate: false,
        tagColor: "msx-white",
        selection: createListSelection("Show", getTotalItems(data, pagination)),
        options: createListOptions(true),
        imageFiller: "height-center"
    };
}

function createShowItems(data: any, extendable: boolean): tvx.MSXContentItem[] {
    let items: tvx.MSXContentItem[] = [];
    if (data != null && data.length > 0) {
        for (let i: number = 0; i < data.length; i++) {
            let item: any = data[i];
            let extensionPage: boolean = extendable === true && data.length - i <= 6;
            let preloadPage: boolean = item.preload === true && item.preloadOffset >= 6 && item.preloadOffset < 18;
            if (item.preload === true) {
                item.preload = false;
            }
            items.push({
                id: "show" + i + "_" + item.id,
                tag: getPinTag(isShowPinned(item.id)),
                number: getListNumber(i),
                title: getShowTitle(item),
                titleFooter: getShowFooter(item),
                image: extensionPage ? null : getThumbnail(item, "large"),
                icon: extensionPage ? "msx-white-soft:more-horiz" : null,
                imagePreload: preloadPage,
                action: createShowAction(item),
                live: extendable === true ? createListLiveExtension(item, i, data.length, extensionPage, "shows") : null
            });
        }
    }
    return items;
}

function createShowsOrderItem(currentOrder: string, activeOrder: string, filter: string): tvx.MSXContentItem {
    var active = currentOrder == activeOrder;
    return {
        focus: active,
        label: getShowsOrderLabel(currentOrder),
        extensionIcon: active ? "check" : "blank",
        action: active ? "back" : "[back|invalidate:content|replace:content:shows:" + createContentRequest("shows:" + currentOrder + ":" + tvx.Tools.strFullCheck(filter, "")) + "]"
    };
}

function createShowsFilterItem(currentFilter: string, activeFilter: string, order: string): tvx.MSXContentItem {
    var active = currentFilter == activeFilter;
    return {
        focus: active,
        label: getShowsFilterLabel(currentFilter),
        extensionIcon: active ? "check" : "blank",
        action: active ? "back" : "[back|invalidate:content|replace:content:shows:" + createContentRequest("shows:" + tvx.Tools.strFullCheck(order, "") + ":" + currentFilter) + "]"
    };
}

function creatShowsOrderPanel(order: string, filter: string): tvx.MSXContentRoot {
    return {
        headline: "Sortierung",
        template: {
            enumerate: false,
            type: "control",
            layout: "0,0,8,1"
        },
        items: [
            createShowsOrderItem("default", order, filter),
            createShowsOrderItem("title", order, filter)
        ]
    };
}

function createShowsFilterPanel(filter: string, order: string): tvx.MSXContentRoot {
    return {
        headline: "Kategorie",
        template: {
            enumerate: false,
            type: "control",
            layout: "0,0,8,1"
        },
        items: [
            createShowsFilterItem("default", filter, order),
            createShowsFilterItem("podcast", filter, order)
        ]
    };
}

function createShowsHeader(order: string, filter: string, data: any, pagination: any): tvx.MSXContentPage {
    return {
        offset: "0,0,0,0.5",
        items: [{
            type: "control",
            layout: "0,0,6,1",
            icon: "sort",
            label: "Sortierung",
            extensionLabel: getShowsOrderLabel(order),
            action: "panel:data",
            data: creatShowsOrderPanel(order, filter)
        }, {
            type: "control",
            layout: "6,0,6,1",
            icon: "filter-list",
            label: "Kategorie",
            extensionLabel: getShowsFilterLabel(filter),
            action: "panel:data",
            data: createShowsFilterPanel(filter, order)
        }, {
            type: "space",
            layout: "1,0,11,1",
            offset: "-1,1.03,1,0",
            text: getShowsCount(getTotalItems(data, pagination))
        }]
    };
}

function createShowHeader(showData: any, seasonId: string, episodesOrder: string, episodesData: any, episodesPagination: any): tvx.MSXContentPage {
    let headline: string = getShowHeadline(showData);
    let description: string = getShowDescription(showData);
    let hasDescription: boolean = tvx.Tools.isFullStr(headline) || tvx.Tools.isFullStr(description);
    let descriptionHeight: number = tvx.Tools.isFullStr(description) && description.length > EXTENDED_SHOW_DESCRIPTION_LENGHT ? 3 : 2;
    let hasSeasons: boolean = showData.seasons != null && showData.seasons.length > 0;
    let activeSeason = getActiveSeason(seasonId, showData.seasons);
    return {
        offset: "0,0,0,0.5",
        items: [{
            display: hasDescription,
            type: "space",
            layout: "0,0,9," + descriptionHeight,
            headline: headline,
            text: description
        }, {
            type: "control",
            layout: "0," + (hasDescription ? descriptionHeight : 0) + ",8,1",
            icon: "sort",
            label: "Sortierung",
            extensionLabel: getEpisodesOrderLabel(episodesOrder, true),
            selection: {
                action: "interaction:commit:message:backdrop:expand"
            },
            action: "panel:data",
            data: createEpisodesOrderPanel("show", episodesOrder, "show:" + showData.id, seasonId, true)
        }, {
            display: hasSeasons,
            type: "control",
            layout: "0," + (hasDescription ? descriptionHeight + 1 : 1) + ",8,1",
            icon: "filter-list",
            label: "Folgenauswahl",
            extensionLabel: getEpisodesSeasonLabel(activeSeason, false),
            selection: {
                action: "interaction:commit:message:backdrop:expand"
            },
            action: "panel:data",
            data: createEpisodesSeasonPanel("show", activeSeason, showData.seasons, "show:" + showData.id, episodesOrder)
        }, {
            id: "pin_show_" + showData.id,
            type: "button",
            layout: "8," + (hasSeasons ? (hasDescription ? descriptionHeight + 1 : 1) : (hasDescription ? descriptionHeight : 0)) + ",1,1",
            icon: getPinIcon(isShowPinned(showData.id)),
            iconSize: "small",
            selection: {
                headline: getPinHint("Lieblingsshow", isShowPinned(showData.id)),
                action: "interaction:commit:message:backdrop:expand"
            },
            action: "interaction:commit:message:menu:pin:toggle:show:" + showData.id
        }, {
            type: "space",
            layout: "1," + (hasSeasons ? (hasDescription ? descriptionHeight + 1 : 1) : (hasDescription ? descriptionHeight : 0)) + ",11,1",
            offset: "-1,1.03,1,0",
            text: getEpisodesCount(getTotalItems(episodesData, episodesPagination))
        }]
    };
}

function createBeansOrderItem(currentOrder: string, activeOrder: string): tvx.MSXContentItem {
    var active = currentOrder == activeOrder;
    return {
        focus: active,
        label: getBeansOrderLabel(currentOrder),
        extensionIcon: active ? "check" : "blank",
        action: active ? "back" : "[back|invalidate:content|replace:content:beans:" + createContentRequest("beans:" + currentOrder) + "]"
    };
}

function creatBeansOrderPanel(order: string): tvx.MSXContentRoot {
    return {
        headline: "Sortierung",
        template: {
            enumerate: false,
            type: "control",
            layout: "0,0,8,1"
        },
        items: [
            createBeansOrderItem("default", order),
            createBeansOrderItem("name", order),
            createBeansOrderItem("episodes", order)
        ]
    };
}

function createBeansHeader(order: string, total: number): tvx.MSXContentPage {
    return {
        offset: "0,0,0,0.5",
        items: [{
            type: "control",
            layout: "0,0,12,1",
            icon: "sort",
            label: "Sortierung",
            extensionLabel: getBeansOrderLabel(order),
            action: "panel:data",
            data: creatBeansOrderPanel(order)
        }, {
            type: "space",
            layout: "1,0,11,1",
            offset: "-1,1.03,1,0",
            text: getBeansCount(total)
        }]
    };
}

function createBeanAction(item: any): string {
    if (item != null && tvx.Tools.isNum(item.mgmtid)) {
        return "content:" + createContentRequest("bean:" + item.mgmtid);
    }
    return null;
}

function createBeanTemplate(data: any): tvx.MSXContentItem {
    return {
        type: "default",
        layout: "0,0,4,2",
        enumerate: false,
        tagColor: "msx-white",
        selection: createListSelection("Bohne", data != null ? data.length : -1),
        options: createListOptions(true),
        imageFiller: "height-right",
        imageOverlay: 0
    };
}

function createBeanItems(data: any): tvx.MSXContentItem[] {
    let items: tvx.MSXContentItem[] = [];
    if (data != null && data.length > 0) {
        for (let i: number = 0; i < data.length; i++) {
            let item: any = data[i];
            items.push({
                id: "bean" + i + "_" + item.mgmtid,
                tag: getPinTag(isBeanPinned(item.mgmtid)),
                number: getListNumber(i),
                title: getBeanName(item),
                titleHeader: getBeanRole(item, true),
                titleFooter: getBeanVideosCount(item),
                image: proxyImageForLocalContext(getImage(item, "large")),
                action: createBeanAction(item)
            });
        }
    }
    return items;
}

function createBeanHeader(beanData: any, episodesOrder: string, episodesData: any, episodesPagination: any): tvx.MSXContentPage {
    let showreelAction: string = getShowreelAction(beanData);
    let hasVideos: boolean = episodesData != null && episodesData.length > 0;
    let hasShowreel: boolean = tvx.Tools.isFullStr(showreelAction);
    let showreelOffsetX: number = 6;
    let infoOffsetX: number = showreelOffsetX + (hasShowreel ? 1 : 0);
    let pinOffsetX: number = infoOffsetX + 1;
    return {
        offset: "0,0,0,-0.5",
        items: [{
            type: "space",
            round: false,
            layout: "0,0,12,2",
            offset: "-1.25,-1,2,1",
            color: "msx-black",
            imagePreload: true,
            image: createHeaderUrl(),
            imageFiller: "width-center",
            imageOverlay: 4
        }, {
            type: "space",
            round: false,
            layout: "0,2,12,1",
            offset: "-1.25,-0.166,2,-0.666",
            imagePreload: true,
            image: createShadowUrl()
        }, {
            type: "space",
            layout: "1,0,6,1",
            offset: "-1,0,0,0",
            text: getBeanRole(beanData, false)
        }, {
            type: "space",
            round: false,
            layout: "6,0,6,2",
            offset: "0,-1,0,1",
            imagePreload: true,
            image: proxyImageForLocalContext(getPotrait(beanData, "large")),
            imageFiller: "height-right"
        }, {
            enable: hasVideos,
            type: "control",
            layout: "0,1,6,1",
            offset: "0,-0.25,0,0",
            icon: "sort",
            label: "Sortierung",
            extensionLabel: getEpisodesOrderLabel(episodesOrder, false),
            action: "panel:data",
            data: createEpisodesOrderPanel("bean", episodesOrder, "bean:" + beanData.mgmtid, null, false)
        }, {
            display: hasShowreel,
            type: "button",
            layout: showreelOffsetX + ",1,1,1",
            offset: "0,-0.25,0,0",
            icon: "smart-display",
            iconSize: "small",
            action: showreelAction,
            playerLabel: "Showreel {chr:ndash} " + getBeanFullName(beanData),
            selection: {
                headline: "Showreel ansehen"
            },
            properties: {
                "control:type": "extended",
                "trigger:complete": "player:eject",
                "trigger:back": "player:eject",
                "button:content:icon": "info",
                "button:content:action": "[]",
                "button:content:enable": false,
                "button:speed:icon": "settings",
                "button:speed:action": getShowreelOptionsAction()
            }
        }, {
            type: "button",
            layout: infoOffsetX + ",1,1,1",
            offset: "0,-0.25,0,0",
            icon: "info",
            iconSize: "small",
            selection: {
                headline: "Beschreibung ansehen"
            },
            action: "panel:data",
            data: {
                pages: [{
                    headline: getBeanFullName(beanData),
                    items: [{
                        type: "space",
                        layout: "0,0,8,6",
                        text: createDescriptionFromHTML(beanData.contentHTML)
                    }, createPanelCloseButton()]
                }]
            }
        }, {
            id: "pin_bean_" + beanData.mgmtid,
            type: "button",
            layout: pinOffsetX + ",1,1,1",
            offset: "0,-0.25,0,0",
            icon: getPinIcon(isBeanPinned(beanData.mgmtid)),
            iconSize: "small",
            selection: {
                headline: getPinHint("Lieblingsbohne", isBeanPinned(beanData.mgmtid))
            },
            action: "interaction:commit:message:menu:pin:toggle:bean:" + beanData.mgmtid
        }, {
            type: "space",
            layout: "1,2,11,1",
            offset: "-1,0.03,1,0",
            text: getVideosCount(hasVideos ? getTotalItems(episodesData, episodesPagination) : 0)
        }]
    };
}

function createPanelCloseButton(): tvx.MSXContentItem {
    return {
        type: "button",
        layout: "7,0,1,1",
        offset: "0,0,-1,-1",
        action: "back"
    };
}

function createOverviewHeader(): tvx.MSXContentPage {
    //Note: Texts and images for this header come from this website: https://rocketbeans.de/wer-wir-sind/
    return {
        offset: "0,0,0,0.5",
        items: [{
            type: "teaser",
            layout: "1,0,11,3",
            offset: "-1,0,1,0",
            imagePreload: true,
            //image: "https://rocketbeans.de/wordpress/wp-content/themes/rocketbeans/img/fotos/gruppenbild_2.jpg",
            image: tvx.Tools.getPrefixUrl("rbtv.msx.benzac.de/assets/header.jpg"),
            imageFiller: "width-center",
            title: "Willkommen bei Rocket Beans TV",
            titleFooter: "Rocket Beans ist Content Creator, Produktionsfirma, Plattform, Kreativschmiede und Publisher für verspielte, popkulturelle Bewegtbild-Inhalte.",
            action: "panel:data",
            data: {
                captionUnderlay: 0,
                pages: [{
                    headline: "Wir sind die Rocket Beans",
                    items: [{
                        type: "space",
                        layout: "0,0,8,3",
                        headline: "Moin moin und hallo!",
                        text: [
                            "Im Herzen Hamburgs bauen wir – digital und analog – den bedeutendsten Raum für Spiel- und Popkultur-Begeisterte, in dem frei experimentiert werden kann. ",
                            "Hier entwickeln wir nach unseren eigenen Spielregeln Ideen und schaffen inspirierende Unterhaltung. ",
                            "Aus einer Produktionsfirma mit 25 Angestellten ist mittlerweile ein Medienunternehmen mit einem breitgefächerten Content-Portfolio geworden. ",
                            "Mit rund 100 Mitarbeitern produzieren wir Bewegtbild für unsere eigene Plattform rocketbeans.tv und verschiedene Auftraggeber. "
                        ]
                    }, createPanelCloseButton()]
                }, {
                    headline: "Die BEANS",
                    items: [{
                        type: "space",
                        layout: "0,0,8,3",
                        imagePreload: true,
                        imageFiller: "width-center",
                        //image: "https://rocketbeans.de/wordpress/wp-content/themes/rocketbeans/img/fotos/BEANS_Gruppenbild_2.jpg"
                        image: tvx.Tools.getPrefixUrl("rbtv.msx.benzac.de/assets/beans.jpg")
                    }, {
                        type: "space",
                        layout: "0,3,8,3",
                        offset: "0,0.5,0,0",
                        text: [
                            "Die fünf Gründer von Rocket Beans: Budi, Etienne, Arno, Nils und Simon. ",
                            "Die Anfangsbuchstaben ihrer Vornamen ergeben zusammen übrigens „BEANS“. ",
                            "Zufälle gibt's. ",
                            "Gemeinsam haben die Fünf die Medienlandschaft geprägt und gehören zu den einflussreichsten Moderatoren und Produzenten Deutschlands im Gaming-Bereich. ",
                            "Zunächst bei NBC Giga, dann als Köpfe von MTV Game One. ",
                            "Gemeinsam mit dem Rocket-Beans-Team haben sie über 300 Folgen Game One produziert und anschließend den Sender Rocket Beans TV gegründet. "
                        ]
                    }, createPanelCloseButton()]
                }, {
                    headline: "Kontakt",
                    items: [{
                        type: "space",
                        layout: "0,0,8,6",
                        text: [
                            "Rocket Beans Entertainment GmbH{br}",
                            "Heinrichstraße 09 – 11{br}",
                            "22769 Hamburg – Germany{br}{br}",
                            "Tel.: +49 (0)40 – 52 47 39 160{br}",
                            "Fax: +49 (0)40 – 43 09 75 55{br}{br}",
                            "Web: https://rocketbeans.de"
                        ]
                    }, createPanelCloseButton()]
                }]
            }
        }]
    };
}

function createOverviewHeadline(headline: string): tvx.MSXContentItem {
    return {
        type: "space",
        layout: "1,0,11,1",
        offset: "-1,0,1,-0.5",
        headline: headline
    };
}

function createOverviewMoreButton(name: string, action: string, count: string): tvx.MSXContentItem {
    return {
        type: "button",
        layout: "11,0,1,1",
        offset: "0,0,0,-0.5",
        icon: "more-horiz",
        iconSize: "small",
        selection: {
            headline: name + " {txt:msx-white-soft:(" + count + ")}"
        },
        action: action
    };
}

function createOverviewEpisode(item: any, index: number, timestamp: number): tvx.MSXContentItem {
    return {
        type: "default",
        layout: (index * 3) + ",0," + (index == 3 ? 2 : 3) + ",3",
        offset: "0,0.5," + (index == 3 ? 1 : 0) + ",0",
        imageHeight: SETTINGS.longTitles ? 1.5 : 1.6,
        imageBoundary: true,
        wrapperColor: "msx-black",
        truncation: "titleHeader|titleFooter",
        imageFiller: "height-center",
        titleHeader: getEpisodeHeader(item),
        titleFooter: getEpisodeFooter(item, timestamp),
        image: tvx.Tools.strFullCheck(getThumbnail(item, "small"), createPlaceholderUrl()),
        stamp: getDuration(item),
        stampColor: "rgba(0,0,0,0.8)",
        progressColor: getTokenColor(item),
        progressBackColor: "rgba(255,255,255,0.25)",
        action: createEpisodeAction(item, false),
        progress: -1,
        live: {
            type: "playback",
            action: "player:show",
            stamp: getDuration(item),
            running: {
                stamp: getLiveDuration(item)
            }
        },
        properties: {
            "resume:key": "url"
        },
        options: createEpisodeListOptions(false, item)
    };
}

function createOverviewShow(item: any, index: number): tvx.MSXContentItem {
    return {
        type: "separate",
        layout: (index * 2) + ",0," + (index == 5 ? 1 : 2) + ",4",
        offset: "0,0.5," + (index == 5 ? 1 : 0) + ",0",
        tag: getPinTag(isShowPinned(item.id)),
        tagColor: "msx-white",
        imageFiller: "height-center",
        title: getShowTitle(item),
        titleFooter: getShowFooter(item),
        image: getThumbnail(item, "large"),
        action: createShowAction(item)
    };
}

function createOverviewEpisodes(data: any, timestamp: number): tvx.MSXContentItem[] {
    let items: tvx.MSXContentItem[] = [];
    if (data != null && data.length > 0) {
        for (let i: number = 0; i < data.length; i++) {
            items.push(createOverviewEpisode(data[i], i, timestamp));
            if (i == 4) {
                break;
            }
        }
    }
    return items;
}

function createOverviewShows(data: any): tvx.MSXContentItem[] {
    let items: tvx.MSXContentItem[] = [];
    if (data != null && data.length > 0) {
        for (let i: number = 0; i < data.length; i++) {
            items.push(createOverviewShow(data[i], i));
            if (i == 6) {
                break;
            }
        }
    }
    return items;
}

function createGenericEpisodesOverview(headline: string, moreButtonName: string, moreButtonAction: string, data: any, pagination: any, showRelated: boolean, timestamp: number): tvx.MSXContentPage {
    let items: tvx.MSXContentItem[] = createOverviewEpisodes(data, timestamp);
    let total: number = getTotalItems(data, pagination);
    if (items.length > 0) {
        items.push(createOverviewHeadline(headline));
        if (total > 4) {
            items.push(createOverviewMoreButton(moreButtonName, moreButtonAction, showRelated ? getEpisodesCount(total) : getVideosCount(total)));
        }
        return {
            offset: "0,0,0,1",
            items: items
        };
    }
    return {
        display: false,
        items: []
    };
}

function createGenericShowsOverview(headline: string, moreButtonName: string, moreButtonAction: string, data: any, pagination: any): tvx.MSXContentPage {
    let items: tvx.MSXContentItem[] = createOverviewShows(data);
    let total: number = getTotalItems(data, pagination);
    if (items.length > 0) {
        items.push(createOverviewHeadline(headline));
        if (total > 6) {
            items.push(createOverviewMoreButton(moreButtonName, moreButtonAction, getShowsCount(total)));
        }
        return {
            offset: "0,0,0,0.5",
            items: items
        };
    }
    return {
        display: false,
        items: []
    };
}

function createNewEpisodesOverview(data: any, pagination: any, timestamp: number): tvx.MSXContentPage {
    return createGenericEpisodesOverview("Neue Videos", "Alle neuen Videos zeigen", "content:" + createContentRequest("new"), data, pagination, false, timestamp);
}

function createEventEpisodesOverview(data: any, pagination: any, timestamp: number): tvx.MSXContentPage {
    return createGenericEpisodesOverview("Aktuelle Events", "Alle Events zeigen", "content:" + createContentRequest("show:" + EVENT_SHOW_ID), data, pagination, true, timestamp);
}

function createCurrentShowsOverview(data: any, pagination: any): tvx.MSXContentPage {
    return createGenericShowsOverview("Aktuelle Shows", "Alle Shows zeigen", "content:" + createContentRequest("shows"), data, pagination);
}

function createCurrentPodcastsOverview(data: any, pagination: any): tvx.MSXContentPage {
    return createGenericShowsOverview("Aktuelle Podcasts", "Alle Podcasts zeigen", "content:" + createContentRequest("shows::podcast"), data, pagination);
}

function createSearchControlButton(control: string, key: string, x: number, y: number, extended: boolean): tvx.MSXContentItem {
    let label: string = null;
    if (control == "back") {
        label = "{ico:backspace}";
    } else if (control == "clear") {
        label = "{ico:clear}";
    } else if (control == "space") {
        label = "{ico:space-bar}";
    }
    return {
        type: "button",
        layout: x + "," + y + "," + (extended ? 4 : 3) + "," + (y == 2 ? 2 : 1),
        offset: y == 2 ? "0,0,0,-1" : null,
        label: label,
        key: key,
        action: "interaction:commit:message:content:search:control:" + control
    };
}

function createSearchInputButton(input: string, key: string, x: number, y: number): tvx.MSXContentItem {
    return {
        type: "button",
        layout: x + "," + y + ",1,1",
        offset: x >= 10 && x <= 12 ? "0.5,0,0,0" : null,
        label: input,
        key: key,
        action: "interaction:commit:message:content:search:input:" + input
    };
}

function createSearchDescription(description: string): tvx.MSXContentItem {
    return {
        type: "space",
        layout: "0,4,16,1",
        offset: "0,0.04,0,0",
        text: description
    };
}

function createSearchHeader(totalShows: number, totalEpisodes: number, searching: boolean): tvx.MSXContentPage {
    return {
        wrap: true,
        items: [
            createSearchInputButton("A", "a", 0, 0),
            createSearchInputButton("B", "b", 1, 0),
            createSearchInputButton("C", "c", 2, 0),
            createSearchInputButton("D", "d", 3, 0),
            createSearchInputButton("E", "e", 4, 0),
            createSearchInputButton("F", "f", 5, 0),
            createSearchInputButton("G", "g", 6, 0),
            createSearchInputButton("H", "h", 7, 0),
            createSearchInputButton("I", "i", 8, 0),
            createSearchInputButton("J", "j", 9, 0),
            createSearchInputButton("K", "k", 0, 1),
            createSearchInputButton("L", "l", 1, 1),
            createSearchInputButton("M", "m", 2, 1),
            createSearchInputButton("N", "n", 3, 1),
            createSearchInputButton("O", "o", 4, 1),
            createSearchInputButton("P", "p", 5, 1),
            createSearchInputButton("Q", "q", 6, 1),
            createSearchInputButton("R", "r", 7, 1),
            createSearchInputButton("S", "s", 8, 1),
            createSearchInputButton("T", "t", 9, 1),
            createSearchInputButton("U", "u", 0, 2),
            createSearchInputButton("V", "v", 1, 2),
            createSearchInputButton("W", "w", 2, 2),
            createSearchInputButton("X", "x", 3, 2),
            createSearchInputButton("Y", "y", 4, 2),
            createSearchInputButton("Z", "z", 5, 2),
            createSearchInputButton("Ä", "quote", 6, 2),
            createSearchInputButton("Ö", "accent", 7, 2),
            createSearchInputButton("Ü", "semicolon", 8, 2),
            createSearchInputButton("ß", "bracket_open", 9, 2),
            createSearchControlButton("back", "delete", 0, 3, false),
            createSearchControlButton("space", "space|insert", 3, 3, true),
            createSearchControlButton("clear", "home|end", 7, 3, false),
            createSearchInputButton("1", "1", 10, 0),
            createSearchInputButton("2", "2", 11, 0),
            createSearchInputButton("3", "3", 12, 0),
            createSearchInputButton("4", "4", 10, 1),
            createSearchInputButton("5", "5", 11, 1),
            createSearchInputButton("6", "6", 12, 1),
            createSearchInputButton("7", "7", 10, 2),
            createSearchInputButton("8", "8", 11, 2),
            createSearchInputButton("9", "9", 12, 2),
            createSearchInputButton("*", null, 10, 3),
            createSearchInputButton("0", "0", 11, 3),
            createSearchInputButton("#", "slash", 12, 3),
            createSearchInputButton("@", null, 14, 0),
            createSearchInputButton("&", null, 15, 0),
            createSearchInputButton("+", "equal", 14, 1),
            createSearchInputButton("-", "dash", 15, 1),
            createSearchInputButton("!", null, 14, 2),
            createSearchInputButton("?", null, 15, 2),
            createSearchInputButton(".", "period", 14, 3),
            createSearchInputButton(",", "comma", 15, 3),
            createSearchDescription(totalShows >= 0 && totalEpisodes >= 0 ? getSearchCount(totalShows, totalEpisodes) : (searching ? "..." : "Gib mindestens 2 Zeichen ein, um eine Suche zu starten"))
        ]
    };
}

function createSearchResultsHeadline(headline: string): tvx.MSXContentItem {
    return {
        type: "space",
        layout: "1,0,11,1",
        offset: "-1,0,1,-0.333",
        headline: headline
    };
}

function createSearchResultsPage(headline: string, baseOffset: number): tvx.MSXContentPage {
    return {
        compress: false,
        offset: tvx.Tools.isFullStr(headline) ? "0,0,0," + (0.666 + baseOffset) : "0,0,0," + baseOffset,
        items: tvx.Tools.isFullStr(headline) ? [createSearchResultsHeadline(headline)] : [],
        options: createListOptions(true)
    };
}

function startSearchResultsPage(pages: tvx.MSXContentPage[], headline: string, baseOffset: number): tvx.MSXContentPage {
    let page: tvx.MSXContentPage = createSearchResultsPage(headline, baseOffset);
    if (pages != null) {
        pages.push(page);
    }
    return page;
}

function createSearchResultsShow(item: any, listIndex: number, pageIndex: number, total: number): tvx.MSXContentItem {
    //Note: Search content is compressed
    let posX: number = 0;
    let offsetX: number = 0;
    let offsetY: number = listIndex < 6 ? 0.666 : 0;
    if (pageIndex == 0) {
        posX = 0;
        offsetX = 0;
    } else if (pageIndex == 1) {
        posX = 2;
        offsetX = 0.666;
    } else if (pageIndex == 2) {
        posX = 4;
        offsetX = 1.333;
    } else if (pageIndex == 3) {
        posX = 8;
        offsetX = 0;
    } else if (pageIndex == 4) {
        posX = 10;
        offsetX = 0.666;
    } else if (pageIndex == 5) {
        posX = 12;
        offsetX = 1.333;
    }
    return {
        type: "separate",
        layout: posX + ",0,2,5",
        offset: offsetX + "," + offsetY + ",0.666,0.333",
        tagColor: "msx-white",
        tag: getPinTag(isShowPinned(item.id)),
        imageFiller: "height-center",
        title: getShowTitle(item),
        titleFooter: getShowFooter(item),
        image: getThumbnail(item, "large"),
        selection: createItemSelection("Show", listIndex, total),
        action: createShowAction(item)
    };
}

function createSearchResultsEpisode(item: any, listIndex: number, pageIndex: number, total: number, timestamp: number): tvx.MSXContentItem {
    //Note: Search content is compressed
    let posX: number = pageIndex < 4 ? pageIndex * 4 : (pageIndex - 4) * 4;
    let posY: number = pageIndex < 4 ? 0 : 4;
    return {
        type: "default",
        layout: posX + "," + posY + ",4,4",
        offset: listIndex < 4 ? "0,0.666,0,0" : null,
        imageHeight: SETTINGS.longTitles ? 2 : 2.133,
        imageBoundary: true,
        wrapperColor: "msx-black",
        truncation: "titleHeader|titleFooter",
        imageFiller: "height-center",
        titleHeader: getEpisodeHeader(item),
        titleFooter: getEpisodeFooter(item, timestamp),
        image: tvx.Tools.strFullCheck(getThumbnail(item, "small"), createPlaceholderUrl()),
        stamp: getDuration(item),
        stampColor: "rgba(0,0,0,0.8)",
        progressColor: getTokenColor(item),
        progressBackColor: "rgba(255,255,255,0.25)",
        selection: createItemSelection("Video", listIndex, total),
        action: createEpisodeAction(item, false),
        progress: -1,
        live: {
            type: "playback",
            action: "player:show",
            stamp: getDuration(item),
            running: {
                stamp: getLiveDuration(item)
            }
        },
        properties: {
            "resume:key": "url"
        },
        options: createEpisodeListOptions(true, item)
    };
}

function createSearchResultsShows(shows: any): tvx.MSXContentPage[] {
    let pages: tvx.MSXContentPage[] = [];
    if (shows != null && shows.length > 0) {
        let page: tvx.MSXContentPage = startSearchResultsPage(pages, "Shows", 0.333);
        let index: number = 0;
        for (let i: number = 0; i < shows.length; i++) {
            if (index == 6) {
                index = 0;
                page = startSearchResultsPage(pages, null, 0.333);
            }
            page.items.push(createSearchResultsShow(shows[i], i, index, shows.length));
            index++;
        }
    }
    return pages;
}

function createSearchResultsEpisodes(episodes: any): tvx.MSXContentPage[] {
    let timestamp: number = tvx.DateTools.getTimestamp();
    let pages: tvx.MSXContentPage[] = [];
    if (episodes != null && episodes.length > 0) {
        let page: tvx.MSXContentPage = startSearchResultsPage(pages, "Videos", 0);
        let index: number = 0;
        for (let i: number = 0; i < episodes.length; i++) {
            if (i == 4 || index == 8) {
                index = 0;
                page = startSearchResultsPage(pages, null, 0);
            }
            page.items.push(createSearchResultsEpisode(episodes[i], i, index, episodes.length, timestamp));
            index++;
        }
    }
    return pages;
}

function createSearchResults(shows: any, episodes: any): tvx.MSXContentPage[] {
    return createSearchResultsShows(shows).concat(createSearchResultsEpisodes(episodes));
}

function createYouTubeQualityItem(currentQuality: string, activeQuality: string): tvx.MSXContentItem {
    var active = currentQuality == activeQuality;
    return {
        focus: active,
        label: getYouTubeQualityLabel(currentQuality),
        extensionIcon: active ? "check" : "blank",
        action: active ? "back" : "[back|interaction:commit:message:content:settings:" + SETTINGS.youtubeQualityId + ":" + currentQuality + "]"
    };
}

export function createVersionNotSupported(): tvx.MSXContentRoot {
    return {
        type: "pages",
        headline: "Warnung",
        pages: [{
            items: [{
                type: "default",
                layout: "0,0,12,6",
                headline: "{ico:msx-yellow:warning} Version wird nicht unterstützt",
                text: [
                    "Media Station X version {txt:msx-white:" + MIN_APP_VERSION + "} oder höher wird für diesen Dienst benötigt.",
                    "{br}{br}",
                    "Bitte aktualisiere Media Station X und versuche es erneut."
                ]
            }]
        }]
    };
}

export function createContentNotFound(contentId: string): tvx.MSXContentRoot {
    return {
        type: "pages",
        headline: "Warnung",
        pages: [{
            items: [{
                type: "default",
                layout: "0,0,12,6",
                headline: "{ico:msx-yellow:warning} Inhalt nicht gefunden",
                text: "Der Inhalt mit der ID {col:msx-white}'" + contentId + "'{col} konnte nicht gefunden werden.",
                action: "back"
            }]
        }]
    };
}

export function createContentLoadError(contentId: string, error: string): tvx.MSXContentRoot {
    return {
        type: "pages",
        headline: "Fehler",
        pages: [{
            items: [{
                type: "default",
                layout: "0,0,12,6",
                headline: "{ico:msx-red:error} Inhalt konnte nicht geladen werden",
                text: "Der Inhalt mit der ID {col:msx-white}'" + contentId + "'{col} konnte nicht geladen werden.{br}{br}" + completeError(error),
                action: "back"
            }]
        }]
    };
}

export function createVideoLoadError(videoId: string, error: string): any {
    return {
        error: "Das Video mit der ID {col:msx-white}'" + videoId + "'{col} konnte nicht geladen werden.{br}" + completeError(error)
    };
}

export function createCredits(): tvx.MSXContentRoot {
    return {
        type: "pages",
        headline: "Credits",
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        pages: [{
            items: [{
                type: "default",
                layout: "0,0,12,6",
                headline: NAME + " " + VERSION,
                text: [
                    "by Benjamin Zachey{br}{br}",
                    "{ico:msx-white:email} {txt:msx-white:admin@benzac.de}{br}",
                    "{ico:msx-white:public} {txt:msx-white:https://msx.benzac.de/info/}{br}",
                    "{ico:msx-white:build} {txt:msx-white:https://github.com/benzac-de/rbtv-msx/}"
                ],
                image: tvx.Tools.getPrefixUrl("msx.benzac.de/info/img/support_qr.png"),
                imageFiller: "height-right",
                imageOverlay: 0,
                imagePreload: true,
                action: "panel:" + tvx.Tools.getPrefixUrl("msx.benzac.de/services/support.php?context=rbtv&platform={PLATFORM}&lang={LANGUAGE}")
            }]
        }]
    };
}

export function createOverview(newEpisodesData: any, eventEpisodesData: any, currentShowsData: any, currentPodcastsData: any): tvx.MSXContentRoot {
    let timestamp: number = tvx.DateTools.getTimestamp();
    return {
        type: "list",
        preload: SETTINGS.preloadPages ? "next" : null,
        headline: "Übersicht",
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        pages: [
            createOverviewHeader(),
            createNewEpisodesOverview(newEpisodesData.data.episodes, newEpisodesData.pagination, timestamp),
            createEventEpisodesOverview(eventEpisodesData.data.episodes, eventEpisodesData.pagination, timestamp),
            createCurrentShowsOverview(currentShowsData.data, currentShowsData.pagination),
            createCurrentPodcastsOverview(currentPodcastsData.data, currentPodcastsData.pagination)
        ]
    };
}

export function createNewEpisodes(data: any): tvx.MSXContentRoot {
    return {
        type: "list",
        preload: SETTINGS.preloadPages ? "next" : null,
        headline: "Neue Videos",
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        template: createEpisodeTemplate("Video", data.data, data.pagination, false),
        items: createEpisodeItems(data.data, data.extendable, "new", false)
    };
}

export function createHistoryEpisodes(data: any): tvx.MSXContentRoot {
    return {
        type: "list",
        preload: SETTINGS.preloadPages ? "next" : null,
        headline: "Verlauf",
        header: createHistoryHeader(data),
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        template: createEpisodeTemplate("Video", data, null, true),
        items: createEpisodeItems(data, false, null, true)
    };
}

export function createShow(showData: any, seasonId: string, episodesOrder: string, episodesData: any): tvx.MSXContentRoot {
    let backdrop: string = getThumbnail(showData.data, "large");
    return {
        flag: "show",
        type: "list",
        preselect: true,
        preload: SETTINGS.preloadPages ? "next" : null,
        headline: getShowTitle(showData.data),
        header: createShowHeader(showData.data, seasonId, episodesOrder, episodesData.data, episodesData.pagination),
        background: createBackgroundUrl(),
        ready: createBackdrop(backdrop),
        transparent: tvx.Tools.isFullStr(backdrop) ? 2 : 0,
        template: createEpisodeTemplate("Folge", episodesData.data, episodesData.pagination, false),
        items: createEpisodeItems(episodesData.data, episodesData.extendable, tvx.Tools.isFullStr(seasonId) ? "show:" + seasonId : "show", false)
    };
}

export function createShows(order: string, filter: string, data: any): tvx.MSXContentRoot {
    return {
        flag: "shows",
        type: "list",
        preload: SETTINGS.preloadPages ? "next" : null,
        headline: "Alle Shows",
        header: createShowsHeader(order, filter, data.data, data.pagination),
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        template: createShowTemplate(data.data, data.pagination),
        items: createShowItems(data.data, data.extendable)
    };
}

export function createBean(beanData: any, episodesOrder: string, episodesData: any): tvx.MSXContentRoot {
    return {
        flag: "bean",
        type: "list",
        preload: SETTINGS.preloadPages ? "next" : null,
        headline: getBeanFullName(beanData.data),
        header: createBeanHeader(beanData.data, episodesOrder, episodesData.data, episodesData.pagination),
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        template: createEpisodeTemplate("Video", episodesData.data, episodesData.pagination, false),
        items: createEpisodeItems(episodesData.data, episodesData.extendable, "bean", false)
    };
}

export function createBeans(order: string, data: any): tvx.MSXContentRoot {
    return {
        flag: "beans",
        type: "list",
        preload: SETTINGS.preloadPages ? "next" : null,
        headline: "Alle Bohnen",
        header: createBeansHeader(order, data.data.length),
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        template: createBeanTemplate(data.data),
        items: createBeanItems(data.data)
    };
}

export function createSearch(expression: string, data: any, searching: boolean): tvx.MSXContentRoot {
    let shows: any = data != null && data.data != null ? data.data.shows : null;
    let episodes: any = data != null && data.data != null ? data.data.episodes : null;
    let header: tvx.MSXContentPage[] = [createSearchHeader(shows != null ? shows.length : -1, episodes != null ? episodes.length : -1, searching)];
    let results: tvx.MSXContentPage[] = createSearchResults(shows, episodes);
    return {
        compress: true,
        important: true,
        type: "list",
        preload: SETTINGS.preloadPages ? "next" : null,
        headline: "{ico:search} " + (tvx.Tools.isFullStr(expression) ? "\"" + expression + "\"" : "{col:msx-white-soft}Suche nach Shows oder Videos"),
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        pages: header.concat(results)
    };
}

export function createSettings(): tvx.MSXContentRoot {
    //Note: It is not possible anymore to change or preselect the YouTube quality for embedded players (please see update "October 24, 2019" on this page: https://developers.google.com/youtube/iframe_api_reference)
    //However, since this was a great feature (and might be reactivated in the future), we are keeping this setting available.
    return {
        type: "list",
        headline: "Einstellungen",
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        overlay: {
            items: [{
                id: "description",
                type: "space",
                layout: "6,0,6,6",
                offset: "0.25,0,-0.25,0",
                text: ""
            }]
        },
        template: {
            enumerate: false,
            type: "control",
            layout: "0,0,6,1",
            area: "0,0,6,6",
            selection: {
                important: true,
                action: "update:content:overlay:description",
                data: {
                    text: "{ico:msx-blue:info} {context:description}"
                }
            }
        },
        items: [{
            icon: "downloading",
            label: "Seiten vorladen",
            extensionIcon: getSettingsToggleIcon(SETTINGS.preloadPages),
            description: [
                "Wenn Seiten vorgeladen werden, sind die Bilder beim Scrollen schneller sichtbar.",
                "Allerdings kann sich das auf einigen Geräten negativ auf die Scroll-Performance auswirken.",
                "Solltest du Probleme mit der Performance haben, kannst du das Vorladen deaktivieren."
            ].join(" "),
            action: createSettingsToggleAction(SETTINGS.preloadPagesId, SETTINGS.preloadPages)
        }, {
            icon: "short-text",
            label: "Lange Episodentitel",
            extensionIcon: getSettingsToggleIcon(SETTINGS.longTitles),
            description: [
                "Bei langen Episodentitel werden zwei Zeilen (anstelle nur einer Zeile) für den Titel verwendet. Allerdings werden dadurch die Episodenbilder etwas kleiner."
            ].join(" "),
            action: createSettingsToggleAction(SETTINGS.longTitlesId, SETTINGS.longTitles)
        }, {
            icon: "smart-display",
            label: "YouTube Qualität",
            extensionLabel: getYouTubeQualityLabel(SETTINGS.youtubeQuality),
            description: [
                "Die gewünschte YouTube Qualität.",
                "Bitte beachte, dass die hier ausgewählte Qualität nur dann angewendet wird, wenn das Video dies unterstützt.",
                "Sollte die ausgewählte Qualität für ein Video nicht unterstützt werden, wird die nächstgeringere verfügbare Qualität verwendet.",
                "Standardmäßig wird {txt:msx-white:" + getYouTubeQualityLabel("default") + "} verwendet, womit YouTube die geeignete Qualität auswählt.",
                "{br}{br}{ico:msx-yellow:warning}",
                "Derzeit ist diese Funktion von YouTube deaktiviert.",
                "Egal welche Einstellung hier vorgenommen wird, wird {txt:msx-white:" + getYouTubeQualityLabel("default") + "} verwendet.",
                "Um eine mögliche zukünftige Reaktivierung dieser Funktion zu unterstützen, bleibt diese Einstellung verfügbar."
            ].join(" "),
            action: "panel:data",
            data: {
                headline: "YouTube Qualität",
                template: {
                    enumerate: false,
                    type: "control",
                    layout: "0,0,8,1",
                },
                items: [
                    createYouTubeQualityItem("default", SETTINGS.youtubeQuality),
                    createYouTubeQualityItem("2160p", SETTINGS.youtubeQuality),
                    createYouTubeQualityItem("1080p", SETTINGS.youtubeQuality),
                    createYouTubeQualityItem("720p", SETTINGS.youtubeQuality),
                    createYouTubeQualityItem("480p", SETTINGS.youtubeQuality),
                    createYouTubeQualityItem("360p", SETTINGS.youtubeQuality)
                ]
            }
        }]
    };
}

export function createVideoPanel(beansData: any, episodeData: any): tvx.MSXContentRoot {
    let header: tvx.MSXContentPage = null;
    let items: tvx.MSXContentItem[] = [];
    if (beansData != null) {
        for (let beanId in beansData) {
            if (tvx.Tools.isNum(beanId)) {
                let bean: any = beansData[beanId];
                items.push({
                    image: proxyImageForLocalContext(getImage(bean, "small")),
                    imageFiller: "width-center",
                    imagePreload: true,
                    label: getBeanName(bean),
                    action: "player:content:" + createContentRequest("bean:" + beanId)
                });
            }
        }
        for (let i: number = 0; i < items.length; i++) {
            items[i].selection = createItemSelection("Bohne", i, items.length);
        }
    }
    let shrink: boolean = items.length > 6;
    let compress: boolean = items.length > 12;
    if (tvx.Tools.isNum(episodeData.showId) && tvx.Tools.isFullStr(episodeData.showName)) {
        header = {
            compress: false,
            offset: compress ? "0,0,0,1" : "0,0,0,0.5",
            items: [{
                type: "control",
                layout: compress ? "0,0,10,1" : "0,0,8,1",
                offset: compress ? "0,0,0,0.333" : null,
                icon: "local-movies",
                label: episodeData.showName,
                action: "player:content:" + createContentRequest("show:" + episodeData.showId + (tvx.Tools.isNum(episodeData.seasonId) ? ":" + episodeData.seasonId : ""))
            }, {
                display: items.length > 0,
                type: "space",
                layout: compress ? "1,0,9,1" : "1,0,7,1",
                offset: compress ? "-1,1.37,1,0" : "-1,1.03,1,0",
                text: getBeansCount(items.length)
            }]
        };
    }
    if (header == null && items.length == 0) {
        header = {
            items: [{
                type: "default",
                layout: "0,0,8,6",
                headline: "{ico:msx-blue:info} Keine zugehörigen Inhalte verfügbar",
                text: "Dieses Video gehört zu keiner Show und keine Bohne kommt darin vor.",
                action: "back"
            }]
        };
    }
    return {
        compress: compress,
        headline: "Show & Bohnen",
        header: header,
        template: {
            enumerate: false,
            type: "control",
            layout: compress ? "0,0,5,1" : (shrink ? "0,0,4,1" : "0,0,8,1")
        },
        items: items
    };
}