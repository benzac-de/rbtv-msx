import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { callCallback, checkVersion } from "./tools";
import { getEpisodesOrderParameter, getShowsFilterParameter, getShowsOrderParameter } from "./content-tools";
import {
    createContentLoadError,
    createContentNotFound,
    createVideoLoadError,
    createVersionNotSupported,
    createShows,
    createShow,
    createNewEpisodes,
    createBeans,
    createBean,
    createCredits,
    createVideo,
    createOverview
} from "./content-creator";
import {
    loadNewEpisodeList,
    extendNewEpisodeList,
    loadShowList,
    extendShowList,
    loadShowWithEpisodeList,
    extendShowEpisodeList,
    extendShowWithEpisodeList,
    loadBeanWithEpisodeList,
    extendBeanEpisodeList,
    loadBeans,
    loadEpisode,
    loadOverview
} from "./backend";

function handleContentLoadError(contentId: string, data: any, callback: (data: any) => void): boolean {
    if (data != null && tvx.Tools.isFullStr(data.error)) {
        callCallback(createContentLoadError(contentId, data.error), callback);
        return true;
    } else if (data != null && data.data == null) {
        callCallback(createContentLoadError(contentId, "Missing data"), callback);
        return true;
    }
    return false;
}

function handleContentExtendResult(data: any): void {
    tvx.InteractionPlugin.stopLoading();
    if (tvx.Tools.isFullStr(data.error)) {
        tvx.InteractionPlugin.error(data.error);
    }
    tvx.InteractionPlugin.executeAction("reload:content");
}

function handleVideoLoadError(videoId: string, data: any, callback: (data: any) => void): boolean {
    if (data != null && tvx.Tools.isFullStr(data.error)) {
        callCallback(createVideoLoadError(videoId, data.error), callback);
        return true;
    } else if (data != null && data.data == null) {
        callCallback(createVideoLoadError(videoId, "Missing data"), callback);
        return true;
    }
    return false;
}

function getContentToken(contentToken: string, first: boolean): string {
    if (tvx.Tools.isFullStr(contentToken)) {
        let separator: number = contentToken.indexOf(":");
        if (first) {
            return separator >= 0 ? contentToken.substring(0, separator) : contentToken;
        } else {
            return separator >= 0 ? contentToken.substring(separator + 1) : null;
        }
    }
    return null;
}

export function loadContent(contentId: string, callback: (data: any) => void): void {
    tvx.InteractionPlugin.onValidatedSettings((infoData: tvx.MSXAttachedInfo) => {
        if (tvx.Tools.isFullStr(contentId)) {
            if (contentId == "credits") {
                callCallback(createCredits(), callback);
            } else if (checkVersion(infoData)) {
                if (contentId == "overview") {
                    loadOverview((newEpisodesData: any, eventEpisodesData: any, currentShowsData: any, currentPodcastsData: any) => {
                        if (!handleContentLoadError(contentId + ":new", newEpisodesData, callback) &&
                            !handleContentLoadError(contentId + ":events", eventEpisodesData, callback) &&
                            !handleContentLoadError(contentId + ":shows", currentShowsData, callback) &&
                            !handleContentLoadError(contentId + ":podcasts", currentPodcastsData, callback)) {
                            callCallback(createOverview(newEpisodesData, eventEpisodesData, currentShowsData, currentPodcastsData), callback);
                        }
                    });
                } else if (contentId == "shows" || contentId.indexOf("shows:") == 0) {
                    let contentToken: string = contentId.indexOf("shows:") == 0 ? contentId.substring(6) : null;
                    let order: string = tvx.Tools.strFullCheck(getContentToken(contentToken, true), "default");
                    let filter: string = tvx.Tools.strFullCheck(getContentToken(contentToken, false), "default");
                    loadShowList(getShowsOrderParameter(order), getShowsFilterParameter(filter), (showsData: any) => {
                        if (!handleContentLoadError(contentId, showsData, callback)) {
                            callCallback(createShows(order, filter, showsData), callback);
                        }
                    });
                } else if (contentId.indexOf("show:") == 0) {
                    let contentToken: string = contentId.substring(5);
                    let nextContentToken: string = getContentToken(contentToken, false);
                    let showId: string = getContentToken(contentToken, true);
                    let seasonId: string = getContentToken(nextContentToken, true);
                    let episodesOrder: string = tvx.Tools.strFullCheck(getContentToken(nextContentToken, false), "default");
                    loadShowWithEpisodeList(showId, seasonId, getEpisodesOrderParameter(episodesOrder), (showData: any, episodesData: any) => {
                        if (!handleContentLoadError(contentId, showData, callback) && !handleContentLoadError(contentId, episodesData, callback)) {
                            callCallback(createShow(showData, seasonId, episodesOrder, episodesData), callback);
                        }
                    });
                } else if (contentId == "new") {
                    loadNewEpisodeList(getEpisodesOrderParameter("default"), (episodesData: any) => {
                        if (!handleContentLoadError(contentId, episodesData, callback)) {
                            callCallback(createNewEpisodes(episodesData), callback);
                        }
                    });
                } else if (contentId == "beans" || contentId.indexOf("beans:") == 0) {
                    let contentToken: string = contentId.indexOf("beans:") == 0 ? contentId.substring(6) : null;
                    let order: string = tvx.Tools.strFullCheck(getContentToken(contentToken, true), "default");
                    loadBeans(order, (beansData: any) => {
                        if (!handleContentLoadError(contentId, beansData, callback)) {
                            callCallback(createBeans(order, beansData), callback);
                        }
                    });
                } else if (contentId.indexOf("bean:") == 0) {
                    let contentToken: string = contentId.substring(5);
                    let nextContentToken: string = getContentToken(contentToken, false);
                    let beanId: string = getContentToken(contentToken, true);
                    let episodesOrder: string = tvx.Tools.strFullCheck(getContentToken(nextContentToken, false), "default");
                    loadBeanWithEpisodeList(beanId, getEpisodesOrderParameter(episodesOrder), (beanData: any, episodesData: any) => {
                        if (!handleContentLoadError(contentId, beanData, callback) && !handleContentLoadError(contentId, episodesData, callback)) {
                            callCallback(createBean(beanData, episodesOrder, episodesData), callback);
                        }
                    });
                } else {
                    callCallback(createContentNotFound(contentId), callback);
                }
            } else {
                callCallback(createVersionNotSupported(), callback);
            }
        } else {
            callCallback(createContentLoadError(contentId, "Missing ID"), callback);
        }
    });
}

export function executeContent(action: string): void {
    if (tvx.Tools.isFullStr(action)) {
        if (action.indexOf("extend:") == 0) {
            tvx.InteractionPlugin.startLoading();
            let extendAction: string = action.substring(7);
            if (extendAction == "shows") {
                extendShowList(handleContentExtendResult);
            } else if (extendAction == "show") {
                extendShowEpisodeList(handleContentExtendResult);
            } else if (extendAction.indexOf("show:") == 0) {
                extendShowWithEpisodeList(extendAction.substring(5), handleContentExtendResult);
            } else if (extendAction == "new") {
                extendNewEpisodeList(handleContentExtendResult);
            } else if (extendAction == "bean") {
                extendBeanEpisodeList(handleContentExtendResult);
            } else {
                tvx.InteractionPlugin.stopLoading();
            }
        }
    }
}

export function loadVideo(videoId: string, callback: (data: any) => void): void {
    loadEpisode(videoId, (data: any) => {
        if (!handleVideoLoadError(videoId, data, callback)) {
            callCallback(createVideo(videoId, data), callback);
        }
    });
}