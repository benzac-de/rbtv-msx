import * as tvx from "./lib/tvx-plugin-ux-module.min";
import { SETTINGS, callCallback, checkVersion } from "./tools";
import { clearHistory, getHistory, reduceHistory } from "./history";
import {
    MIN_SEARCH_EXPRESSION_LENGHT,
    MAX_SEARCH_EXPRESSION_LENGHT,
    getEpisodesOrderParameter,
    getShowsFilterParameter,
    getShowsOrderParameter,
    createEpisodesFromHistory
} from "./content-tools";
import {
    createContentLoadError,
    createContentNotFound,
    createVersionNotSupported,
    createShows,
    createShow,
    createNewEpisodes,
    createBeans,
    createBean,
    createCredits,
    createOverview,
    createSearch,
    createSettings,
    createHistoryEpisodes
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
    loadOverview,
    performSearch,
    cancelSearch
} from "./backend";

let searchDelay: tvx.TVXDelay = new tvx.Delay(1000);
let searchExpression: string = "";

function reloadContent(focusIndex?: boolean): void {
    tvx.InteractionPlugin.executeAction("reload:content" + (focusIndex === true ? ">item:index" : ""));
}

function handleContentLoadError(contentId: string, data: any, callback: (data: any) => void): boolean {
    if (data != null && tvx.Tools.isFullStr(data.error)) {
        callCallback(createContentLoadError(contentId, data.error), callback);
        return true;
    } else if (data != null && data.data == null && data.canceled !== true) {
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
    reloadContent();
}

function applySearch() {
    if (tvx.Tools.strTrim(searchExpression).length >= MIN_SEARCH_EXPRESSION_LENGHT) {
        searchDelay.start(reloadContent);
    } else {
        searchDelay.stop();
    }
    if (!cancelSearch()) {
        reloadContent();
    }
}

function handleSearchInput(input: string): void {
    if (searchExpression.length < MAX_SEARCH_EXPRESSION_LENGHT) {
        searchExpression += input;
        applySearch();
    }
}

function handleSearchControl(control: string): void {
    if (control == "back") {
        if (searchExpression.length > 0) {
            searchExpression = searchExpression.substring(0, searchExpression.length - 1);
            applySearch();
        }
    } else if (control == "clear") {
        searchExpression = "";
        applySearch();
    } else if (control == "space") {
        if (searchExpression.length > 0 && searchExpression.length < MAX_SEARCH_EXPRESSION_LENGHT && searchExpression[searchExpression.length - 1] != " ") {
            searchExpression += " ";
            applySearch();
        }
    } else {
        tvx.InteractionPlugin.warn("Unknown search control: '" + control + "'");
    }
}

function handleHistoryClear(): void {
    clearHistory();
    reloadContent();
}

function handleHistoryRemove(id: string): void {
    if (tvx.Tools.isFullStr(id)) {
        //Note also handle item IDs: "episode0_1234" -> "1234"
        let separator: number = id.indexOf("_");
        if (reduceHistory(separator > 0 ? id.substring(separator + 1) : id)) {
            reloadContent(true);
        }
    } else {
        tvx.InteractionPlugin.warn("Empty history remove action");
    }
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
                        //Note: Do not handle episode errors, because a bean could have no episodes
                        if (!handleContentLoadError(contentId, beanData, callback)) {
                            callCallback(createBean(beanData, episodesOrder, episodesData), callback);
                        }
                    });
                } else if (contentId == "search") {
                    let expression: string = tvx.Tools.strTrim(searchExpression);
                    if (expression.length < MIN_SEARCH_EXPRESSION_LENGHT || searchDelay.isBusy()) {
                        callCallback(createSearch(searchExpression, null, searchDelay.isBusy()), callback);
                    } else {
                        performSearch(expression, (resultsData: any) => {
                            if (!handleContentLoadError(contentId, resultsData, callback)) {
                                callCallback(createSearch(searchExpression, resultsData, searchDelay.isBusy()), callback);
                            }
                        });
                    }
                } else if (contentId == "history") {
                    callCallback(createHistoryEpisodes(createEpisodesFromHistory(getHistory())), callback);
                } else if (contentId == "settings") {
                    callCallback(createSettings(), callback);
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
        } else if (action.indexOf("search:") == 0) {
            let searchAction: string = action.substring(7);
            if (searchAction.indexOf("input:") == 0) {
                handleSearchInput(searchAction.substring(6));
            } else if (searchAction.indexOf("control:") == 0) {
                handleSearchControl(searchAction.substring(8));
            } else {
                tvx.InteractionPlugin.warn("Unknown search action: '" + searchAction + "'");
            }
        } else if (action.indexOf("history:") == 0) {
            let historyAction: string = action.substring(8);
            if (historyAction == "clear") {
                handleHistoryClear();
            } else if (historyAction.indexOf("remove:") == 0) {
                handleHistoryRemove(historyAction.substring(0));
            } else {
                tvx.InteractionPlugin.warn("Unknown history action: '" + historyAction + "'");
            }
        } else if (action.indexOf("settings:") == 0) {
            let settingsAction: string = action.substring(9);
            if (SETTINGS.handleMessage(settingsAction)) {
                reloadContent();
            } else {
                tvx.InteractionPlugin.warn("Unknown settings action: '" + settingsAction + "'");
            }
        } else {
            tvx.InteractionPlugin.warn("Unknown content action: '" + action + "'");
        }
    } else {
        tvx.InteractionPlugin.warn("Empty content action");
    }
}