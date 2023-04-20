import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { callCallback } from "./tools";
import {
    sortBeans,
    appendParameter,
    appendQuery,
    checkId,
    createIdPath,
    validateList,
    extendList,
    getListOffset,
    getListLimit,
    shoudlLoadList,
    startLoadList,
    stopLoadList
} from "./backend-tools";

const SERVER_ROOT: string = "https://api.rocketbeans.tv/v1";
const SHOW_PATH: string = "/media/show/{ID}";
const SHOWS_PATH: string = "/media/show/preview/all";
const SHOW_EPISODES_PATH: string = "/media/episode/byshow/preview/{ID}";
const SEASON_EPISODES_PATH: string = "/media/episode/byseason/preview/{ID}";
const NEW_EPISODES_PATH: string = "/media/episode/preview/newest";
const BEAN_PATH: string = "/bohne/{ID}";
const BEANS_PATH: string = "/bohne/portrait/all";
const BEAN_EPISODES_PATH: string = "/media/episode/bybohne/{ID}";
const EPISODE_PATH: string = "/media/episode/{ID}";

const cache: any = {};

let showList: any = null;
let episodeList: any = null;

function loadContent(path: string, query: string, callback?: (data: any) => void, useCache?: boolean): void {
    if (tvx.Tools.isFullStr(path)) {
        let url: string = appendQuery(SERVER_ROOT + path, query);
        if (useCache === true && cache[url] != null) {
            callCallback(cache[url], callback);
        } else {
            tvx.Services.ajax.get(url, {
                success(data: any) {
                    if (data.success === true) {
                        if (data.data != null) {
                            if (useCache === true) {
                                cache[url] = data;
                            }
                            callCallback(data, callback);
                        } else {
                            callCallback({
                                error: "Backend error: Missing data"
                            }, callback);
                        }
                    } else {
                        callCallback({
                            error: "Backend error: " + tvx.Tools.strToNum(data.code, -1) + ": " + tvx.Tools.strFullCheck(data.message, "Unknown error")
                        }, callback);
                    }
                },
                error(message: string) {
                    callCallback({
                        error: message
                    }, callback);
                }
            });
        }
    } else {
        callCallback({
            error: "Backend error: Missing path"
        }, callback);
    }
}

export function loadShow(id: string, callback?: (data: any) => void): void {
    if (checkId(id, callback)) {
        loadContent(createIdPath(SHOW_PATH, id), null, callback, true);
    }
}

export function loadShows(offset?: number, limit?: number, order?: string, filter?: string, callback?: (data: any) => void): void {
    let query = appendParameter(null, "offset", offset);
    query = appendParameter(query, "limit", limit);
    query = appendParameter(query, "sortby", order);
    query = appendParameter(query, "only", filter);
    loadContent(SHOWS_PATH, query, callback);
}

export function loadShowList(order?: string, filter?: string, callback?: (data: any) => void, extend?: boolean): boolean {
    showList = validateList(showList, "show", null, order, filter);
    if (shoudlLoadList(showList, extend)) {
        let requestHash: number = startLoadList(showList);
        loadShows(getListOffset(showList), getListLimit(showList), showList.order, showList.filter, (data: any) => {
            if (tvx.Tools.isFullStr(data.error)) {
                showList = null;
                callCallback(data, callback);
            } else if (stopLoadList(showList, requestHash)) {
                extendList(showList, data);
                callCallback(showList, callback);
            } else {
                callCallback({
                    error: "Backend error: Invalidated show list"
                }, callback);
            }
        });
        return true;
    }
    callCallback(showList, callback);
    return false;
}

export function extendShowList(callback?: (data: any) => void): boolean {
    return showList != null ? loadShowList(showList.order, showList.filter, callback, true) : false;
}

export function loadShowEpisodes(id: string, offset?: number, limit?: number, order?: string, callback?: (data: any) => void): void {
    if (checkId(id, callback)) {
        let query = appendParameter(null, "offset", offset);
        query = appendParameter(query, "limit", limit);
        query = appendParameter(query, "order", order);
        loadContent(createIdPath(SHOW_EPISODES_PATH, id), query, callback);
    }
}

export function loadShowEpisodeList(id: string, order?: string, callback?: (data: any) => void, extend?: boolean): boolean {
    episodeList = validateList(episodeList, "show", id, order, null);
    if (shoudlLoadList(episodeList, extend)) {
        let requestHash: number = startLoadList(episodeList);
        loadShowEpisodes(id, getListOffset(episodeList), getListLimit(episodeList), episodeList.order, (data: any) => {
            if (tvx.Tools.isFullStr(data.error)) {
                episodeList = null;
                callCallback(data, callback);
            } else if (stopLoadList(episodeList, requestHash)) {
                extendList(episodeList, data);
                callCallback(episodeList, callback);
            } else {
                callCallback({
                    error: "Backend error: Invalidated show episode list"
                }, callback);
            }
        });
        return true;
    }
    callCallback(episodeList, callback);
    return false;
}

export function extendShowEpisodeList(callback?: (data: any) => void): boolean {
    return episodeList != null ? loadShowEpisodeList(episodeList.id, episodeList.order, callback, true) : false;
}

export function loadSeasonEpisodes(id: string, offset?: number, limit?: number, order?: string, callback?: (data: any) => void): void {
    if (checkId(id, callback)) {
        let query = appendParameter(null, "offset", offset);
        query = appendParameter(query, "limit", limit);
        query = appendParameter(query, "order", order);
        loadContent(createIdPath(SEASON_EPISODES_PATH, id), query, callback);
    }
}

export function loadSeasonEpisodeList(id: string, order?: string, callback?: (data: any) => void, extend?: boolean): boolean {
    episodeList = validateList(episodeList, "season", id, order, null);
    if (shoudlLoadList(episodeList, extend)) {
        let requestHash: number = startLoadList(episodeList);
        loadSeasonEpisodes(id, getListOffset(episodeList), getListLimit(episodeList), episodeList.order, (data: any) => {
            if (tvx.Tools.isFullStr(data.error)) {
                episodeList = null;
                callCallback(data, callback);
            } else if (stopLoadList(episodeList, requestHash)) {
                extendList(episodeList, data);
                callCallback(episodeList, callback);
            } else {
                callCallback({
                    error: "Backend error: Invalidated season episode list"
                }, callback);
            }
        });
        return true;
    }
    callCallback(episodeList, callback);
    return false;
}

export function extendSeasonEpisodeList(callback?: (data: any) => void): boolean {
    return episodeList != null ? loadSeasonEpisodeList(episodeList.id, episodeList.order, callback, true) : false;
}

export function loadShowWithEpisodeList(showId: string, seasonId?: string, episodesOrder?: string, callback?: (showData: any, episodesData: any) => void): void {
    let requestService: tvx.BusyService = new tvx.BusyService();
    let showData: any = null;
    let episodesData: any = null;
    requestService.start();
    loadShow(showId, (data: any) => {
        showData = data;
        requestService.stop();
    });
    requestService.start();
    if (tvx.Tools.isFullStr(seasonId)) {
        loadSeasonEpisodeList(seasonId, episodesOrder, (data: any) => {
            episodesData = data;
            requestService.stop();
        });
    } else {
        loadShowEpisodeList(showId, episodesOrder, (data: any) => {
            episodesData = data;
            requestService.stop();
        });
    }
    if (callback != null && typeof callback == "function") {
        requestService.onReady(() => {
            callback(showData, episodesData);
        });
    };
}

export function extendShowWithEpisodeList(seasonId?: string, callback?: (data: any) => void): void {
    if (tvx.Tools.isFullStr(seasonId)) {
        extendSeasonEpisodeList(callback);
    } else {
        extendShowEpisodeList(callback);
    }
}

export function loadNewEpisodes(offset?: number, limit?: number, order?: string, callback?: (data: any) => void): void {
    let query = appendParameter(null, "offset", offset);
    query = appendParameter(query, "limit", limit);
    query = appendParameter(query, "order", order);
    loadContent(NEW_EPISODES_PATH, query, callback);
}

export function loadNewEpisodeList(order?: string, callback?: (data: any) => void, extend?: boolean): boolean {
    episodeList = validateList(episodeList, "new", null, order, null);
    if (shoudlLoadList(episodeList, extend)) {
        let requestHash: number = startLoadList(episodeList);
        loadNewEpisodes(getListOffset(episodeList), getListLimit(episodeList), episodeList.order, (data: any) => {
            if (tvx.Tools.isFullStr(data.error)) {
                episodeList = null;
                callCallback(data, callback);
            } else if (stopLoadList(episodeList, requestHash)) {
                extendList(episodeList, data);
                callCallback(episodeList, callback);
            } else {
                callCallback({
                    error: "Backend error: Invalidated new episode list"
                }, callback);
            }
        });
        return true;
    }
    callCallback(episodeList, callback);
    return false;
}

export function extendNewEpisodeList(callback?: (data: any) => void): boolean {
    return episodeList != null ? loadNewEpisodeList(episodeList.order, callback, true) : false;
}

export function loadBean(id: string, callback?: (data: any) => void): void {
    if (checkId(id, callback)) {
        loadContent(createIdPath(BEAN_PATH, id), null, callback, true);
    }
}

export function loadBeans(order?: string, callback?: (data: any) => void): void {
    loadContent(BEANS_PATH, null, (data: any) => {
        sortBeans(data, order);
        callCallback(data, callback);
    }, true);
}

export function loadBeanEpisodes(id: string, offset?: number, limit?: number, order?: string, callback?: (data: any) => void): void {
    if (checkId(id, callback)) {
        let query = appendParameter(null, "offset", offset);
        query = appendParameter(query, "limit", limit);
        query = appendParameter(query, "order", order);
        loadContent(createIdPath(BEAN_EPISODES_PATH, id), query, callback);
    }
}

export function loadBeanEpisodeList(id: string, order?: string, callback?: (data: any) => void, extend?: boolean): boolean {
    episodeList = validateList(episodeList, "bean", id, order, null);
    if (shoudlLoadList(episodeList, extend)) {
        let requestHash: number = startLoadList(episodeList);
        loadBeanEpisodes(id, getListOffset(episodeList), getListLimit(episodeList), episodeList.order, (data: any) => {
            if (tvx.Tools.isFullStr(data.error)) {
                episodeList = null;
                callCallback(data, callback);
            } else if (stopLoadList(episodeList, requestHash)) {
                extendList(episodeList, data);
                callCallback(episodeList, callback);
            } else {
                callCallback({
                    error: "Backend error: Invalidated bean episode list"
                }, callback);
            }
        });
        return true;
    }
    callCallback(episodeList, callback);
    return false;
}

export function extendBeanEpisodeList(callback?: (data: any) => void): boolean {
    return episodeList != null ? loadBeanEpisodeList(episodeList.id, episodeList.order, callback, true) : false;
}

export function loadBeanWithEpisodeList(id: string, episodesOrder?: string, callback?: (beanData: any, episodesData: any) => void): void {
    let requestService: tvx.BusyService = new tvx.BusyService();
    let beanData: any = null;
    let episodesData: any = null;
    requestService.start();
    loadBean(id, (data: any) => {
        beanData = data;
        requestService.stop();
    });
    requestService.start();
    loadBeanEpisodeList(id, episodesOrder, (data: any) => {
        episodesData = data;
        requestService.stop();
    });
    if (callback != null && typeof callback == "function") {
        requestService.onReady(() => {
            callback(beanData, episodesData);
        });
    };
}

export function loadEpisode(id: string, callback?: (data: any) => void): void {
    if (checkId(id, callback)) {
        loadContent(createIdPath(EPISODE_PATH, id), null, callback);
    }
}