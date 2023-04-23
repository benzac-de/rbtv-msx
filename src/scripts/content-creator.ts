import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { EVENT_SHOW_ID, NAME, VERSION, MIN_APP_VERSION, getImageUrl, objToBase64, appendKeepRatioSuffix } from "./tools";
import {
    EXTENDED_SHOW_DESCRIPTION_LENGHT,
    getTokenUrl,
    addTextPrefix,
    getBeanName,
    getBeanFullName,
    getBeansOrderLabel,
    getDuration,
    getLiveDuration,
    getEpisodeFooter,
    getEpisodesCount,
    getEpisodesOrderLabel,
    getEpisodesSeasonLabel,
    getImage,
    getListNumber,
    getSeasonsCount,
    getShowDescription,
    getShowFooter,
    getShowTitle,
    getShowsCount,
    getShowsFilterLabel,
    getShowsOrderLabel,
    getThumbnail,
    getTokenColor,
    getTotalItems,
    getPotraitImage,
    getBeansCount,
    createContentRequest,
    createVideoRequest,
    getVideoTitle,
    getVideoDescription,
    getBeanId,
    getShowId,
    getEpisodeId,
    getShowreelAction,
    createHeaderUrl,
    createShadowUrl,
    createBackgroundUrl
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

function createListLiveExtension(item: any, index: number, length: number, contentId: string): tvx.MSXLive {
    return item != null && index == length - 1 ? {
        type: "setup",
        action: "interaction:commit:message:content:extend:" + contentId
    } : null;
}

function createListOptions(): tvx.MSXContentPage {
    return {
        items: [{
            layout: "0,0,8,1",
            type: "control",
            icon: "vertical-align-top",
            label: "Zum Anfang der Liste",
            action: "[cleanup|focus:index:-1]"
        }]
    };
}

function createListSelection(total: number): tvx.MSXSelection {
    return {
        headline: "{context:number}/" + total
    };
}

function createItemSelection(index: number, total: number): tvx.MSXSelection {
    return {
        headline: (index + 1) + "/" + total
    };
}

function createBackdrop(url: string): tvx.MSXReady {
    return {
        action: "interaction:commit:message:backdrop:" + tvx.Tools.strFullCheck(url, "none")
    };
}

function createEpisodesOrderItem(flag: string, currentOrder: string, activeOrder: string, contentId: string, seasonId: string): tvx.MSXContentItem {
    var active = currentOrder == activeOrder;
    return {
        focus: active,
        label: getEpisodesOrderLabel(currentOrder),
        extensionIcon: active ? "check" : "blank",
        action: active ? "back" : "[back|invalidate:content|replace:content:" + flag + ":" + createContentRequest(contentId + ":" + tvx.Tools.strFullCheck(seasonId, "") + ":" + currentOrder) + "]"
    };
}

function createEpisodesOrderPanel(flag: string, order: string, contentId: string, seasonId: string): tvx.MSXContentRoot {
    return {
        headline: "Sortierung",
        template: {
            enumerate: false,
            type: "control",
            layout: "0,0,8,1"
        },
        items: [
            createEpisodesOrderItem(flag, "default", order, contentId, seasonId),
            createEpisodesOrderItem(flag, "reverse", order, contentId, seasonId)
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
        selection: index >= 0 ? createItemSelection(index, total) : null,
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
        headline: "Staffel",
        template: {
            enumerate: false,
            type: "control",
            layout: compress ? "0,0,10,1" : "0,0,8,1"
        },
        header: createEpisodesSeasonPanelHeader(flag, activeSeason, total, contentId, order, compress),
        items: items
    };
}

function createEpisodeAction(item: any, autoMode: boolean): string {
    return item != null && tvx.Tools.isNum(item.id) ? "video:" + (autoMode ? "auto:" : "") + "resolve:" + createVideoRequest(item.id) : null;
}

function createEpisodeTemplate(data: any, pagination: any): tvx.MSXContentItem {
    return {
        type: "default",
        layout: "0,0,3,3",
        imageHeight: 1.6,
        imageBoundary: true,
        wrapperColor: "msx-black",
        truncation: "titleHeader|titleFooter",
        enumerate: false,
        selection: createListSelection(getTotalItems(data, pagination)),
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

function createEpisodeItems(data: any, extendable: boolean, contentId: string): tvx.MSXContentItem[] {
    let items: tvx.MSXContentItem[] = [];
    let timestamp: number = tvx.DateTools.getTimestamp();
    if (data != null && data.length > 0) {
        for (let i: number = 0; i < data.length; i++) {
            let item: any = data[i];
            items.push({
                id: getEpisodeId(item),
                number: getListNumber(i),
                titleHeader: addTextPrefix("{col:msx-white}", item.title),
                titleFooter: getEpisodeFooter(item, timestamp),
                image: getThumbnail(item, "small"),
                stamp: getDuration(item),
                liveStamp: getLiveDuration(item),
                progressColor: getTokenColor(item),
                imagePreload: item.preload === true,
                live: extendable === true ? createListLiveExtension(item, i, data.length, contentId) : null,
                action: createEpisodeAction(item, false)
            });
        }
    }
    return items;
}

function createShowAction(item: any): string {
    return item != null && tvx.Tools.isNum(item.id) ? "content:" + createContentRequest("show:" + item.id) : null;
}

function createShowTemplate(data: any, pagination: any): tvx.MSXContentItem {
    return {
        type: "separate",
        layout: "0,0,2,4",
        enumerate: false,
        selection: createListSelection(getTotalItems(data, pagination)),
        imageFiller: "height-center"
    };
}

function createShowItems(data: any, extendable: boolean): tvx.MSXContentItem[] {
    let items: tvx.MSXContentItem[] = [];
    if (data != null && data.length > 0) {
        for (let i: number = 0; i < data.length; i++) {
            let item: any = data[i];
            items.push({
                id: getShowId(item),
                number: getListNumber(i),
                title: getShowTitle(item),
                titleFooter: getShowFooter(item),
                image: getThumbnail(item, "large"),
                imagePreload: item.preload === true,
                action: createShowAction(item),
                live: extendable === true ? createListLiveExtension(item, i, data.length, "shows") : null
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
    let headline: string = getShowFooter(showData);
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
            layout: "0," + (hasDescription ? descriptionHeight : 0) + ",9,1",
            icon: "sort",
            label: "Sortierung",
            extensionLabel: getEpisodesOrderLabel(episodesOrder),
            action: "panel:data",
            data: createEpisodesOrderPanel("show", episodesOrder, "show:" + showData.id, seasonId)
        }, {
            display: hasSeasons,
            type: "control",
            layout: "0," + (hasDescription ? descriptionHeight + 1 : 1) + ",9,1",
            icon: "filter-list",
            label: "Staffel",
            extensionLabel: getEpisodesSeasonLabel(activeSeason, false),
            action: "panel:data",
            data: createEpisodesSeasonPanel("show", activeSeason, showData.seasons, "show:" + showData.id, episodesOrder)
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
        if (item.episodeCount > 0) {
            return "content:" + createContentRequest("bean:" + item.mgmtid);
        } else {
            return "info:Diese Bohne arbeitet hinter den Kulissen und ist in keinem Video zu sehen."
        }
    }
    return null;
}

function createBeanTemplate(data: any): tvx.MSXContentItem {
    return {
        type: "default",
        layout: "0,0,4,2",
        enumerate: false,
        selection: createListSelection(data != null ? data.length : -1),
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
                id: getBeanId(item),
                number: getListNumber(i),
                title: getBeanName(item),
                titleFooter: item.episodeCount > 0 ? "{ico:video-collection} " + item.episodeCount : null,
                image: getImage(item, "large"),
                action: createBeanAction(item)
            });
        }
    }
    return items;
}

function createBeanHeader(beanData: any, episodesOrder: string, episodesData: any, episodesPagination: any): tvx.MSXContentPage {
    let showreelAction: string = getShowreelAction(beanData);
    return {
        offset: "0,0,0,-0.5",
        items: [{
            type: "space",
            layout: "0,0,12,2",
            offset: "-1.25,-1,2,1",
            color: "msx-black",
            imagePreload: true,
            image: createHeaderUrl(),
            imageFiller: "width-center",
            imageOverlay: 4
        }, {
            type: "space",
            layout: "0,2,12,1",
            offset: "-1.25,-0.166,2,-0.666",
            imagePreload: true,
            image: createShadowUrl()
        }, {
            type: "space",
            layout: "6,0,6,2",
            offset: "0,-1,0,1",
            imagePreload: true,
            image: getPotraitImage(beanData, "large"),
            imageFiller: "height-right"
        }, {
            type: "control",
            layout: "0,1,6,1",
            offset: "0,-0.25,0,0",
            icon: "sort",
            label: "Sortierung",
            extensionLabel: getEpisodesOrderLabel(episodesOrder),
            action: "panel:data",
            data: createEpisodesOrderPanel("bean", episodesOrder, "bean:" + beanData.mgmtid, null)
        }, {
            display: tvx.Tools.isFullStr(showreelAction),
            type: "control",
            layout: "6,1,3,1",
            offset: "0,-0.25,0,0",
            icon: "smart-display",
            label: "Showreel",
            action: showreelAction,
            playerLabel: "Showreel - " + getBeanFullName(beanData),
            properties: {
                "control:type": "extended",
                "trigger:complete": "player:eject",
                "trigger:back": "player:eject",
                "button:content:icon": "info",
                "button:content:action": "[]",
                "button:content:enable": false
            }
        }, {
            type: "space",
            layout: "1,2,11,1",
            offset: "-1,0.03,1,0",
            text: getEpisodesCount(getTotalItems(episodesData, episodesPagination))
        }]
    };
}

function createVideoPanel(beansData: any, episodeData: any): tvx.MSXContentRoot {
    let header: tvx.MSXContentPage = null;
    let items: tvx.MSXContentItem[] = [];
    if (beansData != null) {
        for (let beanId in beansData) {
            if (tvx.Tools.isNum(beanId)) {
                let bean: any = beansData[beanId];
                items.push({
                    image: getImage(bean, "small"),
                    imageFiller: "width-center",
                    imagePreload: true,
                    label: getBeanName(bean),
                    action: "player:content:" + createContentRequest("bean:" + beanId)
                });
            }
        }
        for (let i: number = 0; i < items.length; i++) {
            items[i].selection = createItemSelection(i, items.length);
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

function createPanelCloseButton(): tvx.MSXContentItem {
    return {
        type: "button",
        layout: "7,0,1,1",
        offset: "0,0,-1,-1",
        action: "back"
    };
}

function createOverviewHeader(): tvx.MSXContentPage {
    return {
        offset: "0,0,0,0.5",
        items: [{
            type: "teaser",
            layout: "1,0,11,3",
            offset: "-1,0,1,0",
            imagePreload: true,
            image: "https://rocketbeans.de/wordpress/wp-content/themes/rocketbeans/img/fotos/gruppenbild_2.jpg",
            imageFiller: "width-center",
            title: "Willkommen bei Rocket Beans TV",
            titleFooter: "Rocket Beans ist Content Creator, Produktionsfirma, Plattform, Kreativschmiede und Publisher für verspielte, popkulturelle Bewegtbild-Inhalte.",
            action: "panel:data",
            data: {
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
                    }, createPanelCloseButton()
                    ]
                }, {
                    headline: "Die BEANS",
                    items: [{
                        type: "space",
                        layout: "0,0,8,3",
                        imagePreload: true,
                        imageFiller: "width-center",
                        image: "https://rocketbeans.de/wordpress/wp-content/themes/rocketbeans/img/fotos/BEANS_Gruppenbild_2.jpg"
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

function createOverviewHeadline(headline: string, count: string): tvx.MSXContentItem {
    return {
        type: "space",
        layout: "1,0,11,1",
        offset: "-1,0,1,-0.5",
        headline: headline + " {txt:msx-white-soft:(" + count + ")}"
    };
}

function createOverviewMoreButton(name: string, action: string): tvx.MSXContentItem {
    return {
        type: "button",
        layout: "11,0,1,1",
        offset: "0,0,0,-0.5",
        icon: "more-horiz",
        iconSize: "small",
        selection: {
            headline: name
        },
        action: action
    };
}

function createOverviewEpisode(item: any, index: number, timestamp: number): tvx.MSXContentItem {
    //Note: Do not set ID, because the same episodes can be listed in different sections
    return {
        type: "default",
        layout: (index * 3) + ",0," + (index == 3 ? 2 : 3) + ",3",
        offset: "0,0.5," + (index == 3 ? 1 : 0) + ",0",
        imageHeight: 1.6,
        imageBoundary: true,
        wrapperColor: "msx-black",
        truncation: "titleHeader|titleFooter",
        imageFiller: "height-center",
        titleHeader: addTextPrefix("{col:msx-white}", item.title),
        titleFooter: getEpisodeFooter(item, timestamp),
        image: getThumbnail(item, "small"),
        stamp: getDuration(item),
        progressColor: getTokenColor(item),
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
        }
    };
}

function createOverviewShow(item: any, index: number): tvx.MSXContentItem {
    //Note: Do not set ID, because the same shows can be listed in different sections
    return {
        type: "separate",
        layout: (index * 2) + ",0," + (index == 5 ? 1 : 2) + ",4",
        offset: "0,0.5," + (index == 5 ? 1 : 0) + ",0",
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

function createGenericEpisodesOverview(headline: string, moreButtonName: string, moreButtonAction: string, data: any, pagination: any, timestamp: number): tvx.MSXContentPage {
    let items: tvx.MSXContentItem[] = createOverviewEpisodes(data, timestamp);
    let total: number = getTotalItems(data, pagination);
    if (items.length > 0) {
        items.push(createOverviewHeadline(headline, getEpisodesCount(total)));
        if (total > 4) {
            items.push(createOverviewMoreButton(moreButtonName, moreButtonAction));
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
        items.push(createOverviewHeadline(headline, getShowsCount(total)));
        if (total > 6) {
            items.push(createOverviewMoreButton(moreButtonName, moreButtonAction));
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
    return createGenericEpisodesOverview("Neue Videos", "Zeige alle neuen Videos", "content:" + createContentRequest("new"), data, pagination, timestamp);
}

function createEventEpisodesOverview(data: any, pagination: any, timestamp: number): tvx.MSXContentPage {
    return createGenericEpisodesOverview("Aktuelle Events", "Zeige alle Events", "content:" + createContentRequest("show:" + EVENT_SHOW_ID), data, pagination, timestamp);
}

function createCurrentShowsOverview(data: any, pagination: any): tvx.MSXContentPage {
    return createGenericShowsOverview("Alle Shows", "Zeige alle Shows", "content:" + createContentRequest("shows"), data, pagination);
}

function createCurrentPodcastsOverview(data: any, pagination: any): tvx.MSXContentPage {
    return createGenericShowsOverview("Alle Podcasts", "Zeige alle Podcasts", "content:" + createContentRequest("shows::podcast"), data, pagination);
}

export function createVersionNotSupported(): tvx.MSXContentRoot {
    return {
        type: "pages",
        headline: "Warning",
        pages: [{
            items: [{
                type: "default",
                layout: "0,0,12,6",
                headline: "{ico:msx-yellow:warning} Version Not Supported",
                text: [
                    "Media Station X version {txt:msx-white:" + MIN_APP_VERSION + "} or higher is needed for this service.",
                    "{br}{br}",
                    "Please update Media Station X and try it again."
                ]
            }]
        }]
    };
}

export function createContentNotFound(contentId: string): tvx.MSXContentRoot {
    return {
        type: "pages",
        headline: "Warning",
        pages: [{
            items: [{
                type: "default",
                layout: "0,0,12,6",
                headline: "{ico:msx-yellow:warning} Content Not Found",
                text: "Content with ID '" + contentId + "' could not be found."
            }]
        }]
    };
}

export function createContentLoadError(contentId: string, error: string): tvx.MSXContentRoot {
    return {
        type: "pages",
        headline: "Error",
        pages: [{
            items: [{
                type: "default",
                layout: "0,0,12,6",
                headline: "{ico:msx-red:error} Content Load Error",
                text: "Content with ID '" + contentId + "' could not be loaded.{br}{br}" + completeError(error)
            }]
        }]
    };
}

export function createVideoLoadError(videoId: string, error: string): any {
    return {
        error: "Video with ID '" + videoId + "' could not be loaded.{br}" + completeError(error)
    };
}

export function createCredits(): tvx.MSXContentRoot {
    return {
        type: "pages",
        headline: "Credits",
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
                image: "http://msx.benzac.de/info/img/bmc_qr.png",
                imageFiller: "height-right",
                imageOverlay: 0,
                imagePreload: true
            }]
        }]
    };
}

export function createOverview(newEpisodesData: any, eventEpisodesData: any, currentShowsData: any, currentPodcastsData: any): tvx.MSXContentRoot {
    let timestamp: number = tvx.DateTools.getTimestamp();
    return {
        type: "list",
        preload: "next",
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
        preload: "next",
        headline: "Neue Videos",
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        template: createEpisodeTemplate(data.data, data.pagination),
        items: createEpisodeItems(data.data, data.extendable, "new"),
        options: createListOptions()
    };
}

export function createShow(showData: any, seasonId: string, episodesOrder: string, episodesData: any): tvx.MSXContentRoot {
    let backdrop: string = getThumbnail(showData.data, "large");
    return {
        flag: "show",
        type: "list",
        preload: "next",
        headline: getShowTitle(showData.data),
        header: createShowHeader(showData.data, seasonId, episodesOrder, episodesData.data, episodesData.pagination),
        background: createBackgroundUrl(),
        ready: createBackdrop(backdrop),
        transparent: tvx.Tools.isFullStr(backdrop) ? 2 : 0,
        template: createEpisodeTemplate(episodesData.data, episodesData.pagination),
        items: createEpisodeItems(episodesData.data, episodesData.extendable, tvx.Tools.isFullStr(seasonId) ? "show:" + seasonId : "show"),
        options: createListOptions()
    };
}

export function createShows(order: string, filter: string, data: any): tvx.MSXContentRoot {
    return {
        flag: "shows",
        type: "list",
        preload: "next",
        headline: "Alle Shows",
        header: createShowsHeader(order, filter, data.data, data.pagination),
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        template: createShowTemplate(data.data, data.pagination),
        items: createShowItems(data.data, data.extendable),
        options: createListOptions()
    };
}

export function createBean(beanData: any, episodesOrder: string, episodesData: any): tvx.MSXContentRoot {
    return {
        flag: "bean",
        type: "list",
        preload: "next",
        headline: getBeanFullName(beanData.data),
        header: createBeanHeader(beanData.data, episodesOrder, episodesData.data, episodesData.pagination),
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        template: createEpisodeTemplate(episodesData.data, episodesData.pagination),
        items: createEpisodeItems(episodesData.data, episodesData.extendable, "bean"),
        options: createListOptions()
    };
}

export function createBeans(order: string, data: any): tvx.MSXContentRoot {
    return {
        flag: "beans",
        type: "list",
        preload: "next",
        headline: "Alle Bohnen",
        header: createBeansHeader(order, data.data.length),
        background: createBackgroundUrl(),
        ready: createBackdrop(null),
        template: createBeanTemplate(data.data),
        items: createBeanItems(data.data),
        options: createListOptions()
    };
}

export function createVideo(videoId: string, data: any): any {
    if (data.data.episodes != null && data.data.episodes.length > 0) {
        let beans: any = data.data.bohnen;
        let episode: any = data.data.episodes[0];
        let url: string = getTokenUrl(episode);
        if (tvx.Tools.isFullStr(url)) {
            return {
                url: url,
                label: getVideoTitle(episode),
                properties: {
                    "control:type": "extended",
                    "info:size": "large",
                    "info:overlay": "full",
                    "info:image": getThumbnail(episode, "small"),
                    "info:text": getVideoDescription(episode, tvx.DateTools.getTimestamp()),
                    "trigger:complete": episode.next != null ? "[player:button:next:execute|resume:position:none]" : "player:eject",
                    "trigger:back": "player:eject",
                    "button:content:icon": "info",
                    "button:content:action": "panel:json:" + objToBase64(createVideoPanel(beans, episode)),
                    "button:next:icon": "default",
                    "button:next:action": createEpisodeAction(episode.next, true),
                    "button:next:key": "channel_up",
                    "button:prev:icon": "default",
                    "button:prev:action": createEpisodeAction(episode.prev, true),
                    "button:prev:key": "channel_down"
                }
            };
        }
        return createVideoLoadError(videoId, "No supported token found");
    }
    return createVideoLoadError(videoId, "No episodes found");
}